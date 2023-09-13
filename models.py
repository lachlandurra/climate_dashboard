# models.py

from app import db
from flask_login import UserMixin

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class ReportingPeriod(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_month = db.Column(db.String(50), nullable=False)
    end_month = db.Column(db.String(50), nullable=False)
    start_year = db.Column(db.Integer, nullable=False)
    end_year = db.Column(db.Integer, nullable=False)
    reports = db.relationship('EmissionReport', backref='reporting_period', lazy=True)

class BusinessOrFacility(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # Either 'local business' or 'council facility'
    reports = db.relationship('EmissionReport', backref='business_or_facility', lazy=True)

class EmissionReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    co2_emissions_solar = db.Column(db.Float, nullable=False)
    total_emissions = db.Column(db.Float, nullable=False)
    cost_savings = db.Column(db.Float, nullable=False)
    reporting_period_id = db.Column(db.Integer, db.ForeignKey('reporting_period.id'), nullable=False)
    business_or_facility_id = db.Column(db.Integer, db.ForeignKey('business_or_facility.id'), nullable=False)

    # Add a method to determine if it's a local business or council facility
    @property
    def type(self):
        return self.business_or_facility.type

    

