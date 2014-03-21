require 'spec_helper'

describe HomeController do
  describe 'request_creator' do
    context 'when signed in', :signed_in do
      it 'updates user and redirects to creator' do
        put :request_creator
        expect(response).to redirect_to creator_path
        expect(current_user.reload.requested_creator).to be_true
      end
    end

    context 'when not signed in' do
      it 'redirects to sign in' do
        put :request_creator
        expect(response).to redirect_to new_user_session_path
      end
    end
  end
end
