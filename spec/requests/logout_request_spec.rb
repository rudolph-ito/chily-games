require 'spec_helper'

describe 'logout' do
  before do
    sign_in_user
  end

  context 'no referrer' do
    it 'redirects to root path' do
      delete destroy_user_session_path
      response.should redirect_to root_path
      flash[:notice].should == "Signed out successfully."
    end
  end

  context 'with referrer' do
    it 'redirects to referrer' do
      delete destroy_user_session_path, nil, {'HTTP_REFERER' => invariants_url}
      response.should redirect_to invariants_path
      flash[:notice].should == "Signed out successfully."
    end
  end
end