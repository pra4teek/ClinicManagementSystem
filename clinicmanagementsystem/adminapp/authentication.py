from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

from apibackendapp.models import User


class ClinicJWTAuthentication(BaseAuthentication):
    """
    General authentication class used across all clinic endpoints.
    If the Authorization header is missing, malformed, expired, or a demo token,
    it returns None instead of raising AuthenticationFailed.
    This allows endpoints with AllowAny permissions to function without 401 errors.
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
            # Stale, invalid, or demo token: return None so AllowAny endpoints succeed
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