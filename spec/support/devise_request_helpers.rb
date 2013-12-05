module DeviseRequestHelpers
  include Warden::Test::Helpers

  shared_context 'signed in', signed_in: true do
    let(:current_user) { create :user }
    before { sign_in current_user }
  end

  shared_context 'signed in as admin', signed_in_as_admin: true do
    let(:current_user) { create :user, admin: true }
    before { sign_in current_user }
  end
end

RSpec.configure do |config|
  config.include Devise::TestHelpers, :type => :controller
  config.include Devise::TestHelpers, :type => :requests

  config.include DeviseRequestHelpers, :type => :controller
  config.include DeviseRequestHelpers, :type => :requests

  config.before(:all) { Warden.test_mode! }
  config.after(:each) { Warden.test_reset! }
end
