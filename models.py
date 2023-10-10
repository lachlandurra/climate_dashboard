from app import db
from flask_login import UserMixin
from sqlalchemy.ext.hybrid import hybrid_property 

STAR_RATING_MJ_SQ_M_REDUCTION = {
    6.0: 0,
    6.1: 1.3,
    6.2: 3.9,
    6.3: 6.5,
    6.4: 9.1,
    6.5: 13.0,
    6.6: 14.4,
    6.7: 17.2,
    6.8: 20.0,
    6.9: 22.8,
    7.0: 27.0,
    7.1: 28.3,
    7.2: 30.9,
    7.3: 33.5,
    7.4: 36.1,
    7.5: 40.0,
    7.6: 41.3,
    7.7: 43.9,
    7.8: 46.5,
    7.9: 49.1,
    8.0: 53.0,
    8.1: 54.2,
    8.2: 56.6,
    8.3: 59.0,
    8.4: 61.4,
    8.5: 65.0,
    8.6: 66.3,
    8.7: 68.9,
    8.8: 71.5,
    8.9: 74.1,
    9.0: 78.0,
    9.1: 79.1,
    9.2: 81.3,
    9.3: 83.5,
    9.4: 85.7,
    9.5: 89.0,
    9.6: 90.0,
    9.7: 92.0,
    9.8: 94.0,
    9.9: 96.0,
    10.0: 99.0
} 

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

    # Add the hybrid_property for other_emissions
    @hybrid_property
    def other_emissions(self):
        return self.total_emissions - self.co2_emissions_solar

class EmissionFactor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    factor = db.Column(db.Float, nullable=False)  # Emission factor in kg CO2-e / kWh

    # Added a backref for a relationship with EnergyRatingData
    energy_rating_data = db.relationship('EnergyRatingData', back_populates='emission_factor', uselist=False)


class EnergyRatingData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_ = db.Column(db.Integer, nullable=False)  # Class 1 or 2
    year = db.Column(db.Integer, nullable=False)
    half_year = db.Column(db.Integer, nullable=False)  # 1 or 2
    star_rating = db.Column(db.Float, nullable=False)
    certificates_issued = db.Column(db.Integer, nullable=False)
    avg_conditioned_area = db.Column(db.Float, nullable=False)
    emission_factor_id = db.Column(db.Integer, db.ForeignKey('emission_factor.id'), nullable=True)

    # Added a relationship with EmissionFactor
    emission_factor = db.relationship('EmissionFactor', back_populates='energy_rating_data')

    # Calculated fields for MJ Saved and Emissions Reduction, not to be stored in the database
    @property
    def mj_saved_per_annum(self):
        mj_reduction = STAR_RATING_MJ_SQ_M_REDUCTION.get(self.star_rating, 0)
        result = self.certificates_issued * self.avg_conditioned_area * mj_reduction
        print(result)  # Add a print or log statement here
        return result


    @property
    def emissions_reduction(self):
        if self.emission_factor:
            return self.mj_saved_per_annum * self.emission_factor.factor * 3.6 / 1000
        return None
