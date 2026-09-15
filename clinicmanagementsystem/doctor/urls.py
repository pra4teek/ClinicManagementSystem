from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path

router = DefaultRouter()
router.register(r'doctors', views.DoctorViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'prescriptions', views.PrescriptionViewSet)
router.register(r'prescription-items', views.PrescriptionItemViewSet)
router.register(r'lab-prescriptions', views.LabPrescriptionViewSet)

urlpatterns = []





urlpatterns += router.urls