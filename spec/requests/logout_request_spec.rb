require 'spec_helper'

describe 'logout' do
  before do
    sign_in_user
  end

  context 'no referrer' do
    it 'redirects to root path' do
      delete destroy_user_session_path
      expect(response).to redirect_to root_path
      expect(flash[:notice]).to eql "Signed out successfully."
    end
  end

  context 'with referrer' do
    it 'redirects to referrer' do
      delete destroy_user_session_path, nil, {'HTTP_REFERER' => invariants_url}
      expect(response).to redirect_to invariants_path
      expect(flash[:notice]).to eql "Signed out successfully."
    end
  end
end