class ApplicationController < ActionController::Base
  protect_from_forgery

  # Authority

  def authority_forbidden(error)
    Rails.logger.warn(error.message)

    respond_to do |format|
      format.html { redirect_to root_path, notice: error.message }
      format.json { head 401 }
    end
  end

  # Devise

  before_filter :configure_permitted_parameters, if: :devise_controller?

  def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) { |u| u.permit(:username, :email, :password, :password_confirmation) }
    devise_parameter_sanitizer.for(:sign_in) { |u| u.permit(:login, :password, :remember_me) }
    devise_parameter_sanitizer.for(:account_update) { |u| u.permit(:username, :email, :password, :password_confirmation) }
  end

  def after_sign_out_path_for(resource_or_scope)
    request.referrer || root_path
  end
end
