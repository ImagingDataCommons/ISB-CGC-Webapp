try:
    __version__ = __import__('pkg_resources').get_distribution(
        'django-adminrestrict'
    ).version
except:
    __version__ = ''


def get_version():
    return __version__
