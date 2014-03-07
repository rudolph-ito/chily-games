require 'spec_helper'

describe UsersController do
  describe 'show' do
    let(:user) { create :user }

    it 'succeeds' do
      get :show, id: user.id
      response.status.should == 200
    end
  end

  describe 'edit' do
    let(:user) { create :user }

    context 'when signed in', :signed_in do
      context 'for self' do
        it 'succeeds' do
          get :edit, id: current_user.id
          response.status.should == 200
        end
      end

      context 'for other user' do
        it 'redirects to root' do
          get :edit, id: user.id
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: user.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:user) { create :user, username: 'old' }

    context 'when signed in', :signed_in do
      context 'for self' do
        context 'with valid attributes' do
          it 'updates and redirects to user' do
            put :update, id: current_user.id, user: { username: 'new' }
            current_user.reload.username.should == 'new'
            response.should redirect_to current_user
          end
        end

        context 'with invalid attributes' do
          it 'renders edit' do
            old_username = current_user.username
            put :update, id: current_user.id, user: { username: nil }
            current_user.reload.username.should == old_username
            response.should render_template 'edit'
          end
        end
      end

      context 'for other user' do
        it 'redirects to root' do
          put :update, id: user.id, user: { username: 'new' }
          user.reload.username.should == 'old'
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: user.id, user: { username: 'new' }
        response.should redirect_to new_user_session_path
        user.reload.username.should == 'old'
      end
    end
  end

  describe 'destroy' do
    let!(:user) { create :user }

    context 'when signed in', :signed_in do
      context 'for other user' do
        it 'redirects to root path' do
          expect{
            delete :destroy, id: user.id
            response.should redirect_to root_path
          }.to change(User, :count).by(0)
        end
      end

      context 'for self' do
        it 'destroys and redirects to login' do
          expect{
            delete :destroy, id: current_user.id
            response.should redirect_to new_user_session_path
          }.to change(User, :count).by(-1)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: user.id
          response.should redirect_to new_user_session_path
        }.to change(User, :count).by(0)
      end
    end
  end
end
