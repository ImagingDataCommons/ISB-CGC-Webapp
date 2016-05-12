"""

Copyright 2016, Institute for Systems Biology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

"""

import logging
import os
import traceback
import time
from MySQLdb import connect, cursors
from GenespotRE import secret_settings
from argparse import ArgumentParser

SUPERUSER_NAME = 'isb'

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


def get_mysql_connection():
    env = os.getenv('SERVER_SOFTWARE')
    db_settings = secret_settings.get('DATABASE')['default']
    db = None
    ssl = None
    if 'OPTIONS' in db_settings and 'ssl' in db_settings['OPTIONS']:
        ssl = db_settings['OPTIONS']['ssl']

    if env and env.startswith('Google App Engine/'):  # or os.getenv('SETTINGS_MODE') == 'prod':
        # Connecting from App Engine
        db = connect(
            unix_socket='/cloudsql/<YOUR-APP-ID>:<CLOUDSQL-INSTANCE>',
            db='',
            user='',
        )
    else:
        db = connect(host=db_settings['HOST'], port=db_settings['PORT'], db=db_settings['NAME'],
                     user=db_settings['USER'], passwd=db_settings['PASSWORD'], ssl=ssl)

    return db


def create_study_views(project, source_table, studies):
    db = get_mysql_connection()
    cursor = db.cursor()

    study_names = {}

    view_check_sql = "SELECT COUNT(TABLE_NAME) FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = %s;"
    create_view_sql = "CREATE VIEW %s AS SELECT * FROM %s"
    where_proj = " WHERE Project=%s"
    where_study = " AND Study=%s;"

    try:
        for study in studies:
            view_name = "%s_%s_%s" % (project, study, source_table,)
            cursor.execute(view_check_sql, (view_name,))

            # Drop any pre-existing view definition under this name
            if cursor.fetchall()[0][0] > 0:
                logger.debug("Found pre-existing view '"+view_name+"', attempting to remove it...")
                cursor.execute("DROP VIEW %s;", (view_name,))
                # Double-check...
                cursor.execute(view_check_sql, (view_name,))
                # If it's still there, there's a problem
                if cursor.fetchall()[0][0] > 0:
                    raise Exception("Unable to drop pre-existing view '"+view_name+"'!")

            logger.debug("Creating view '"+view_name+"'")

            # If project and study are the same we assume this is meant to
            # be a one-study project
            makeView = (create_view_sql % (view_name, source_table,)) + where_proj
            params = (project,)

            if project == study:
                makeView += ";"
            else:
                makeView += where_study
                params += (study,)

            cursor.execute(makeView, params)

            logger.debug("Testing creation of view '" + view_name + "'...")

            cursor.execute(view_check_sql, (view_name,))
            if cursor.fetchall()[0] <= 0:
                raise Exception("Unable to create view '" + view_name + "'!")

            cursor.execute("SELECT COUNT(*) FROM %s;" % view_name)

            for row in cursor.fetchall():
                if row[0] <= 0:
                    logger.debug("Creation of view '"+view_name+"' was successful, but no entries are found in " +
                                 "it. Double-check the "+source_table+" table for valid entries.")
                else:
                    logger.debug("Creation of view '" + view_name + "' was successful.")

            study_names[study] = {"view_name": view_name, "project": project}

        return study_names

    except Exception as e:
        print e
        print traceback.format_exc()

    finally:
        if cursor: cursor.close()
        if db and db.open: db.close()


def bootstrap_user_data_schema(public_feature_table, big_query_dataset, bucket_name, bucket_permissions):
    fetch_studies = "SELECT DISTINCT Study FROM metadata_samples WHERE Project='TCGA';"
    insert_projects = "INSERT INTO projects_project (name, active, last_date_saved, is_public, owner_id) " + \
                      "VALUES (%s,%s,%s,%s,%s);"
    insert_studies = "INSERT INTO projects_study (name, active, last_date_saved, owner_id, project_id) " + \
                     "VALUES (%s,%s,%s,%s,%s);"
    insert_googleproj = "INSERT INTO accounts_googleproject (project_id, project_name, big_query_dataset, user_id) " + \
                        "VALUES (%s,%s,%s,%s);"
    insert_bucket = "INSERT INTO accounts_bucket (bucket_name, bucket_permissions, user_id) VALUES (%s, %s, %s);"
    insert_user_data_tables = "INSERT INTO projects_user_data_tables (study_id, user_id, google_project_id, " + \
                              "google_bucket_id, metadata_data_table, metadata_samples_table, " + \
                              "feature_definition_table) VALUES (%s,%s,%s,%s,%s,%s,%s);"
    googleproj_name = "isb-cgc"
    tables = ['metadata_samples', 'metadata_data']

    studies = {}
    isb_userid = None
    table_study_data = {}
    study_table_views = None
    project_info = {}
    study_info = {}
    googleproj_id = None
    bucket_id = None

    try:

        db = get_mysql_connection()
        cursor = db.cursor()
        cursorDict = db.cursor(cursors.DictCursor)

        cursor.execute("SELECT id FROM auth_user WHERE username = %s;", (SUPERUSER_NAME,))

        for row in cursor.fetchall():
            isb_userid = row[0]

        if isb_userid is None:
            raise Exception("Couldn't retrieve ID for isb user!")

        # Add the projects to the project table and store their generated IDs
        insertTime = time.strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute(insert_projects, ("TCGA", True, insertTime, True, isb_userid,))
        cursor.execute(insert_projects, ("CCLE", True, insertTime, True, isb_userid,))
        cursor.execute(insert_googleproj, ("isb-cgc", googleproj_name, big_query_dataset, isb_userid,))
        cursor.execute(insert_bucket, (bucket_name, bucket_permissions, isb_userid,))
        db.commit()

        cursorDict.execute("SELECT name, id FROM projects_project;")
        for row in cursorDict.fetchall():
            project_info[row['name']] = row['id']

        cursor.execute("SELECT id FROM accounts_googleproject WHERE project_name=%s;", (googleproj_name,))
        for row in cursor.fetchall():
            googleproj_id = row[0]

        cursor.execute("SELECT id FROM accounts_bucket WHERE bucket_name=%s;", (bucket_name,))
        for row in cursor.fetchall():
            bucket_id = row[0]

        # Gather up the studies from the samples table, and add in CCLE manually
        cursor.execute(fetch_studies)
        for row in cursor.fetchall():
            if row[0] not in studies:
                studies[row[0]] = 1

        studies["CCLE"] = 1

        # Make the views
        for table in tables:
            study_table_views = create_study_views("TCGA", table, studies.keys())
            ccle_view = create_study_views("CCLE", table, ["CCLE"])
            study_table_views["CCLE"] = ccle_view["CCLE"]
            table_study_data[table] = study_table_views

        # Add the studies to the study table and store their generated IDs
        for study in study_table_views:
            cursor.execute(insert_studies, (study, True, insertTime, isb_userid,
                                            project_info[study_table_views[study]['project']],))
        db.commit()

        cursorDict.execute("SELECT name, id FROM projects_study;")
        for row in cursorDict.fetchall():
            study_info[row['name']] = row['id']

        # Add the study views to the user_data_tables table
        for study in study_table_views:
            cursor.execute(insert_user_data_tables, (study_info[study], isb_userid, googleproj_id, bucket_id,
                                                     table_study_data['metadata_data'][study]['view_name'],
                                                     table_study_data['metadata_samples'][study]['view_name'],
                                                     public_feature_table))
        db.commit()

        # Compare the number of studies in the user_data_tables table and in the studies table;
        # if they don't match, something might be wrong.
        study_count = 0
        study_udt_count = 0

        cursor.execute("SELECT COUNT(DISTINCT %s) FROM projects_study;", ("id",))
        for row in cursor.fetchall():
            study_count = row[0]

        cursor.execute("SELECT COUNT(DISTINCT %s) FROM projects_user_data_tables;", ("study_id",))
        for row in cursor.fetchall():
            study_udt_count = row[0]

        if study_udt_count == study_count:
            print "[STATUS] Projects and studies appear to have been created successfully: " + study_count.__str__() + \
                    " studies added."
        else:
            print "[WARNING] Unequal number of studies made in the study table as compared to the user_data_table. " + \
                    study_count+" study entries but " + study_udt_count.__str__() + " user_data_table entries."

    except Exception as e:
        print e
        print traceback.format_exc()

    finally:
        if cursor: cursor.close
        if cursorDict: cursorDict.close()
        if db and db.open: db.close


def main():
    cmd_line_parser = ArgumentParser(description="Script to bootstrap the user data schema for TCGA and CCLE")
    cmd_line_parser.add_argument('-p', '--pub-feat-table', type=str, default='Public_Feature_Table',
                                 help="Public features table for projects_user_data_tables entries")
    cmd_line_parser.add_argument('-q', '--bq-dataset', type=str, default='tcga_data_open',
                                 help="BigQuery dataset for this Google Project")
    cmd_line_parser.add_argument('-b', '--bucket-name', type=str, default='isb-cgc-dev',
                                 help="Name of the bucket the source data came from")
    cmd_line_parser.add_argument('-m', '--bucket-perm', type=str, default='read/write',
                                 help="Bucket access permissions")

    args = cmd_line_parser.parse_args()

    bootstrap_user_data_schema(args.pub_feat_table, args.bq_dataset, args.bucket_name, args.bucket_perm)

if __name__ == "__main__":
    main()
