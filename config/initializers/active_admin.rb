ActiveAdmin.setup do |config|
  config.allow_comments = false
  config.authentication_method = :authenticate_user!
  config.batch_actions = false
  config.before_filter :check_admin_role
  config.current_user_method = :current_user
  config.filters = false
  config.logout_link_path = :destroy_user_session_path
  config.root_to = 'users#index'
  config.site_title = "Cyvasse"
end

ActiveAdmin::BaseController.class_eval do

  def check_admin_role
    return if current_user.admin

    flash[:notice] = "You need to be an admin to access this part of the application"
    redirect_to root_path
  end

end
