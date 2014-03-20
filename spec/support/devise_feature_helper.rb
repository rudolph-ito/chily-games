module DeviseFeatureHelper
  def sign_in(params = {})
    @user = create :user, params
    sign_in_with @user.username, @user.password
  end

  def sign_in_admin(params = {})
    @user = create :user, params
    @user.admin
  end

  def sign_in_with(login, password)
    visit new_user_session_path
    fill_in 'Username or Email', with: login
    fill_in 'Password', with: password
    click_on 'Sign in'
  end
end

RSpec.configure do |config|
  config.include DeviseFeatureHelper, :type => :feature
end
