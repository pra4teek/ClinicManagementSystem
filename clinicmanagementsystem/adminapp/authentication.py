from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

from apibackendapp.models import User


class ClinicJWTAuthentication(BaseAuthentication):
    """
    General authentication class used across all clinic endpoints.
    If no usable Authorization header is present, authentication returns None.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]

        try:
            access_token = AccessToken(token)
            user_id = access_token.get('user_id')
            if not user_id:
                return None

            user = User.objects.get(UserId=user_id)
            if not user.isActive:
                return None

            return (user, token)

        except Exception:
            # Invalid or expired credentials are treated as unauthenticated.
            return None


class AdminJWTAuthentication(BaseAuthentication):
    """
    Dedicated authentication class for administrator endpoints.
    Enforces valid JWT tokens and checks that the user has the Admin role.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None

        try:
            parts = auth_header.split()

            if len(parts) != 2 or parts[0].lower() != "bearer":
                raise AuthenticationFailed("Invalid authorization header.")

            token = parts[1]

            access_token = AccessToken(token)

            user_id = access_token.get('user_id')
            if not user_id:
                raise AuthenticationFailed("Invalid token payload: missing user_id.")

            user = User.objects.get(UserId=user_id)

            if not user.isActive:
                raise AuthenticationFailed("User is inactive.")

            if user.RoleId.RoleName != "Admin":
                raise AuthenticationFailed("Admin access required.")

            return (user, token)

        except User.DoesNotExist:
            raise AuthenticationFailed("User not found.")

        except AuthenticationFailed:
            raise

        except Exception:
            raise AuthenticationFailed("Invalid or expired token.")


class IsAdminUser(BasePermission):

    def has_permission(self, request, view):

        if not request.user:
            return False

        if not getattr(request.user, "isActive", False):
            return False

        if not getattr(request.user, "RoleId", None):
            return False

        if request.user.RoleId.RoleName != "Admin":
            return False

        return True


class ClinicRolePermission(BasePermission):
    """Restrict clinic APIs to authenticated users with an allowed clinic role.

    Set ``allowed_roles`` on a viewset, or subclass this permission and set
    ``roles_by_method`` for read/write workflows shared by two roles.
    Administrators retain access to every role-scoped clinic API.
    """

    allowed_roles = ()
    roles_by_method = None

    def has_permission(self, request, view):
        user = request.user
        staff = getattr(user, "staff_profile", None)
        role_record = getattr(user, "RoleId", None) or getattr(staff, "RoleId", None)
        role = getattr(role_record, "RoleName", "")
        staff_user = getattr(staff, "UserId", None)
        is_active = getattr(user, "isActive", getattr(staff_user, "isActive", False))
        if not role or not is_active:
            return False
        if role.casefold() == "admin":
            return True

        allowed = self.roles_by_method.get(request.method, ()) if self.roles_by_method else self.allowed_roles
        return role.casefold() in {item.casefold() for item in allowed}


class IsDoctor(ClinicRolePermission):
    allowed_roles = ("Doctor",)


class IsReceptionist(ClinicRolePermission):
    allowed_roles = ("Receptionist",)


class IsPharmacist(ClinicRolePermission):
    allowed_roles = ("Pharmacist",)


class IsLabTechnician(ClinicRolePermission):
    allowed_roles = ("Lab Technician",)


class IsDoctorOrPharmacistRead(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Pharmacist"),
        "HEAD": ("Doctor", "Pharmacist"),
        "OPTIONS": ("Doctor", "Pharmacist"),
        "POST": ("Doctor", "Pharmacist"),
        "PUT": ("Doctor", "Pharmacist"),
        "PATCH": ("Doctor", "Pharmacist"),
        "DELETE": ("Doctor", "Pharmacist"),
    }


class IsDoctorReadOrPharmacist(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Pharmacist"),
        "HEAD": ("Doctor", "Pharmacist"),
        "OPTIONS": ("Doctor", "Pharmacist"),
        "POST": ("Pharmacist",),
        "PUT": ("Pharmacist",),
        "PATCH": ("Pharmacist",),
        "DELETE": ("Pharmacist",),
    }


class IsDoctorOrLabTechnician(ClinicRolePermission):
    allowed_roles = ("Doctor", "Lab Technician")


class IsDoctorReadOrLabTechnician(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Lab Technician"),
        "HEAD": ("Doctor", "Lab Technician"),
        "OPTIONS": ("Doctor", "Lab Technician"),
        "POST": ("Lab Technician",),
        "PUT": ("Lab Technician",),
        "PATCH": ("Lab Technician",),
        "DELETE": ("Lab Technician",),
    }


class IsDoctorCreateOrLabTechnicianUpdate(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Lab Technician"),
        "HEAD": ("Doctor", "Lab Technician"),
        "OPTIONS": ("Doctor", "Lab Technician"),
        "POST": ("Doctor",),
        "PUT": ("Lab Technician",),
        "PATCH": ("Lab Technician",),
        "DELETE": ("Lab Technician",),
    }


class IsClinicReadOrReceptionistWrite(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Receptionist", "Pharmacist", "Lab Technician"),
        "HEAD": ("Doctor", "Receptionist", "Pharmacist", "Lab Technician"),
        "OPTIONS": ("Doctor", "Receptionist", "Pharmacist", "Lab Technician"),
        "POST": ("Receptionist",),
        "PUT": ("Receptionist",),
        "PATCH": ("Receptionist",),
        "DELETE": ("Receptionist",),
    }


class IsClinicReadOrReceptionistOrDoctorUpdate(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Receptionist", "Pharmacist", "Lab Technician"),
        "HEAD": ("Doctor", "Receptionist", "Pharmacist", "Lab Technician"),
        "OPTIONS": ("Doctor", "Receptionist", "Pharmacist", "Lab Technician"),
        "POST": ("Receptionist",),
        "PUT": ("Receptionist",),
        "PATCH": ("Receptionist", "Doctor"),
        "DELETE": ("Receptionist",),
    }


class IsDoctorOrLabReadOnly(ClinicRolePermission):
    allowed_roles = ("Doctor", "Lab Technician")
    roles_by_method = {
        "GET": ("Doctor", "Lab Technician"),
        "HEAD": ("Doctor", "Lab Technician"),
        "OPTIONS": ("Doctor", "Lab Technician"),
    }


class IsDoctorOrReceptionistWrite(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Receptionist"),
        "HEAD": ("Doctor", "Receptionist"),
        "OPTIONS": ("Doctor", "Receptionist"),
        "POST": ("Receptionist",),
        "PUT": ("Receptionist",),
        "PATCH": ("Receptionist",),
        "DELETE": ("Receptionist",),
    }


class IsDoctorOrReceptionistAppointment(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Doctor", "Receptionist"),
        "HEAD": ("Doctor", "Receptionist"),
        "OPTIONS": ("Doctor", "Receptionist"),
        "POST": ("Receptionist",),
        "PUT": ("Receptionist",),
        "PATCH": ("Doctor", "Receptionist"),
        "DELETE": ("Receptionist",),
    }


class IsReceptionistOrPharmacistRead(ClinicRolePermission):
    roles_by_method = {
        "GET": ("Receptionist", "Pharmacist"),
        "HEAD": ("Receptionist", "Pharmacist"),
        "OPTIONS": ("Receptionist", "Pharmacist"),
        "POST": ("Receptionist",),
        "PUT": ("Receptionist",),
        "PATCH": ("Receptionist",),
        "DELETE": ("Receptionist",),
    }


class IsDoctorOrReceptionist(ClinicRolePermission):
    allowed_roles = ("Doctor", "Receptionist")
