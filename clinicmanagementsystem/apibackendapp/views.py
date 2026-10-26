from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken, TokenError

from .models import User, Doctor, Staff, AuditLog
from .passwords import verify_and_upgrade_password


class ClinicLoginView(APIView):
    """
    Universal login view for all clinic personnel:
    Admin, Doctor, Receptionist, Pharmacist, Lab Technician.
    Authenticates directly against the MySQL apibackendapp.User table.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = (request.data.get("Username") or request.data.get("username") or "").strip()
        password = request.data.get("Password") or request.data.get("password") or ""

        if not username or not password:
            return Response(
                {"error": "Username and Password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(Username__iexact=username)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not verify_and_upgrade_password(user, password):
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.isActive:
            return Response(
                {"error": "User account is inactive. Please contact the administrator."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Resolve display name and role
        role_name = user.RoleId.RoleName if user.RoleId else "Staff"
        display_name = user.Username
        doctor_id = None
        specialization = None
        department_name = None

        doctor_profile = Doctor.objects.filter(UserId=user).first()
        if doctor_profile:
            display_name = f"Dr. {doctor_profile.Name}"
            doctor_id = doctor_profile.DoctorId
            specialization = doctor_profile.Specialization
            if doctor_profile.DepartmentId:
                department_name = doctor_profile.DepartmentId.DepartmentName
        else:
            staff_profile = Staff.objects.filter(UserId=user).first()
            if staff_profile:
                display_name = staff_profile.Name

        # Record login audit log
        try:
            AuditLog.objects.create(
                UserId=user,
                ActionType="LOGIN",
                TableAffected="User",
                RecordId=user.UserId,
                Details=f"User {user.Username} ({role_name}) logged in successfully."
            )
        except Exception:
            pass

        access_token = AccessToken()
        access_token["user_id"] = user.UserId
        access_token["username"] = user.Username
        access_token["role"] = role_name
        if doctor_id:
            access_token["doctor_id"] = doctor_id

        user_payload = {
            "userId": user.UserId,
            "UserId": user.UserId,
            "username": user.Username,
            "Username": user.Username,
            "role": role_name,
            "Role": role_name,
            "name": display_name,
            "Name": display_name,
            "doctorId": doctor_id,
            "DoctorId": doctor_id,
            "specialization": specialization,
            "departmentName": department_name,
        }

        refresh_token = RefreshToken()
        refresh_token['user_id'] = user.UserId
        refresh_token['username'] = user.Username
        refresh_token['role'] = role_name
        if doctor_id:
            refresh_token['doctor_id'] = doctor_id

        return Response(
            {
                "message": "Login successful.",
                "access": str(access_token),
                "refresh": str(refresh_token),
                "token": str(access_token),
                "user": user_payload
            },
            status=status.HTTP_200_OK
        )


class ClinicTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        raw_refresh = request.data.get('refresh')
        if not raw_refresh:
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(raw_refresh)
            user = User.objects.get(UserId=refresh.get('user_id'))
        except (TokenError, User.DoesNotExist, TypeError, ValueError):
            return Response({'detail': 'Refresh token is invalid or expired.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.isActive:
            return Response({'detail': 'User account is inactive.'}, status=status.HTTP_401_UNAUTHORIZED)

        access = refresh.access_token
        access['username'] = user.Username
        access['role'] = user.RoleId.RoleName
        doctor = Doctor.objects.filter(UserId=user).first()
        if doctor:
            access['doctor_id'] = doctor.DoctorId
        return Response({'access': str(access), 'refresh': str(refresh)}, status=status.HTTP_200_OK)
