from rest_framework.routers import DefaultRouter
from doctor import views
from django.urls import path
from .views import ClinicLoginView

router = DefaultRouter()
router.register(r'doctors', views.DoctorViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'prescriptions', views.PrescriptionViewSet)
router.register(r'prescription-items', views.PrescriptionItemViewSet)
router.register(r'lab-prescriptions', views.LabPrescriptionViewSet)

urlpatterns = [
    path('login/', ClinicLoginView.as_view(), name='clinic-login'),
]
urlpatterns += router.urls