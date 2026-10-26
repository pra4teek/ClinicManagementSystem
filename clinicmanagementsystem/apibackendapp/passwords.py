from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.utils.crypto import constant_time_compare


def verify_and_upgrade_password(user, raw_password):
    """Verify legacy seed passwords and upgrade them to Django password hashes."""
    encoded_password = user.Password or ""
    try:
        identify_hasher(encoded_password)
    except ValueError:
        if not constant_time_compare(encoded_password, raw_password):
            return False
        user.Password = make_password(raw_password)
        user.save(update_fields=["Password"])
        return True
    return check_password(raw_password, encoded_password)
