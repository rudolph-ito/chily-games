shared_context 'signed in', signed_in: true do
  let(:current_user_params) { {} }
  let(:current_user) { create :user, current_user_params }
  before { sign_in current_user }
end

RSpec.configure do |config|
  config.include Devise::TestHelpers, :type => :controller
  config.include Warden::Test::Helpers, :type => :controller

  config.before(:all) { Warden.test_mode! }
  config.after(:each) { Warden.test_reset! }
end
