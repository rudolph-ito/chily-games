shared_context 'signed in', signed_in: true do
  let(:current_user_params) { {} }
  let(:current_user) { create :user, current_user_params }
  before { sign_in current_user }
end

module DeviseRequestHelpers
  def sign_in_user(params = {})
    user = create :user, params
    post user_session_path, user: { login: user.email, password: user.password }
  end

  def sign_in_admin(params = {})
    sign_in_user(params.merge(admin: true))
  end
end

RSpec.configure do |config|
  config.include Devise::TestHelpers, :type => :controller
  config.include Warden::Test::Helpers, :type => :controller

  config.include DeviseRequestHelpers, :type => :request

  config.before(:all) { Warden.test_mode! }
  config.after(:each) { Warden.test_reset! }
end
