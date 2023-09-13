from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_migrate import Migrate  

# Move the app creation into a factory function.
db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
migrate = Migrate()
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///climatedashboard.db'

    print("Database URI:", app.config['SQLALCHEMY_DATABASE_URI'])  # Add this line for debugging
    app.secret_key = 'your_secret_key_here'

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    from models import User, ReportingPeriod, EmissionReport, BusinessOrFacility

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @app.route('/')
    @login_required
    def index():
        return render_template('index.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
        if request.method == 'POST':
            username = request.form['username']
            password = request.form['password']
            hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
            user = User(username=username, password=hashed_pw)
            db.session.add(user)
            db.session.commit()
            return redirect(url_for('login'))
        return render_template('register.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
        if request.method == 'POST':
            username = request.form['username']
            password = request.form['password']
            user = User.query.filter_by(username=username).first()
            if user and bcrypt.check_password_hash(user.password, password):
                login_user(user)
                return redirect(url_for('index'))
        return render_template('login.html')

    @app.route('/create_reporting_period', methods=['GET', 'POST'])
    @login_required
    def create_reporting_period():
        # this creates a new reporting period, where the user can enter the start and end month and year
        if request.method == 'POST':
            start_month = request.form['start_month']
            start_year = request.form['start_year']
            end_month = request.form['end_month']
            end_year = request.form['end_year']
            reporting_period = ReportingPeriod(start_month=start_month, start_year=start_year, end_month=end_month, end_year=end_year)
            db.session.add(reporting_period)
            db.session.commit()
            return redirect(url_for('index'))
        return render_template('create_reporting_period.html')

    @app.route('/view_reports', methods=['GET', 'POST'])
    @login_required
    def view_reports():
        reporting_periods = ReportingPeriod.query.all()

        if not reporting_periods:  # Check if there are no reporting periods
            return render_template('view_reports.html', reporting_periods=[], reports=[])

        if request.method == 'POST':
            reporting_period_id = request.form['reporting_period']
        else:  # If method is GET, default to the first reporting period
            reporting_period_id = reporting_periods[0].id

        selected_reporting_period = ReportingPeriod.query.get(reporting_period_id)
        reports = selected_reporting_period.reports

        return render_template('view_reports.html', reporting_periods=reporting_periods, reports=reports, selected_period=reporting_period_id)
    
    
    @app.route('/update_report', methods=['POST'])
    @login_required
    def update_report():
        report_id = request.form.get('report_id')
        column_name = request.form.get('column_name')
        value = request.form.get('value')

        report = EmissionReport.query.get(report_id)

        if not report:
            return jsonify(status="error", message="Report not found")

        if column_name == "co2_emissions_solar":
            report.co2_emissions_solar = float(value)
        elif column_name == "cost_savings":
            report.cost_savings = float(value)
        elif column_name == "total_emissions":  # Handling the total_emissions column
            report.total_emissions = float(value)
        else:
            return jsonify(status="error", message="Invalid column name")

        db.session.commit()

        return jsonify(status="success")




    @app.route('/add_business_or_facility', methods=['GET', 'POST'])
    @login_required
    def add_business_or_facility():
        show_error_modal = False
        if request.method == 'POST':
            name = request.form['name']
            type_ = request.form['type']

            existing_biz = BusinessOrFacility.query.filter_by(name=name).first()
            if existing_biz:
                show_error_modal = True
            else:
                business_or_facility = BusinessOrFacility(name=name, type=type_)
                db.session.add(business_or_facility)
                db.session.commit()
                return redirect(url_for('index'))

        return render_template('add_business_or_facility.html', show_error_modal=show_error_modal)


    @app.route('/add_emission_report', methods=['GET', 'POST'])
    @login_required
    def add_emission_report():
        businesses_or_facilities = BusinessOrFacility.query.all()  # Get all businesses
        reporting_periods = ReportingPeriod.query.all()
        show_error_modal = False
        
        if request.method == 'POST':
            business_or_facility_id = request.form['business_or_facility']  
            reporting_period_id = request.form['reporting_period']

            # Check if a report already exists for this business and reporting period
            existing_report = EmissionReport.query.filter_by(business_or_facility_id=business_or_facility_id, reporting_period_id=reporting_period_id).first()
            if existing_report:
                show_error_modal = True
            else:
                co2_emissions_solar = request.form['co2_emissions_solar']
                total_emissions = request.form['total_emissions']
                cost_savings = request.form['cost_savings']

                report = EmissionReport(co2_emissions_solar=co2_emissions_solar, total_emissions=total_emissions, 
                                        cost_savings=cost_savings, reporting_period_id=reporting_period_id, 
                                        business_or_facility_id=business_or_facility_id)
                db.session.add(report)
                db.session.commit()
                return redirect(url_for('index'))

        return render_template('add_emission_report.html', businesses_or_facilities=businesses_or_facilities, reporting_periods=reporting_periods, show_error_modal=show_error_modal)

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        return redirect(url_for('index'))
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True)