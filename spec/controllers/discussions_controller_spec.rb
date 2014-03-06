require 'spec_helper'

describe DiscussionsController do
  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end

  describe 'new' do
    context 'when signed in as admin', :signed_in_as_admin do
      it 'succeeds' do
        get :new
        response.status.should == 200
      end
    end

    context 'when signed in', :signed_in do
      it 'succeeds' do
        get :new
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :new
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'create' do
    let(:valid_attributes) { { title: 'discussion', description: 'a discussion' } }

    context 'when signed in as admin', :signed_in_as_admin do
      context 'with valid attributes' do
        it 'creates and redirects' do
          expect {
            post :create, discussion: valid_attributes
            response.should redirect_to Discussion.last
          }.to change(Discussion, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, discussion: valid_attributes.merge(title: '')
            response.should render_template 'new'
          }.to change(Discussion, :count).by(0)
        end
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to login' do
        expect {
          post :create, discussion: valid_attributes
          response.should redirect_to root_path
        }.to change(Discussion, :count).by(0)
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, discussion: valid_attributes
          response.should redirect_to new_user_session_path
        }.to change(Discussion, :count).by(0)
      end
    end
  end

  describe 'edit' do
    let(:discussion) { create :discussion }

    context 'when signed in as admin', :signed_in_as_admin do
      it 'succeeds' do
        get :edit, id: discussion.id
        response.status.should == 200
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to root' do
        get :edit, id: discussion.id
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: discussion.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:discussion) { create :discussion, title: 'old' }

    context 'when signed in as admin', :signed_in_as_admin do
      context 'with valid attributes' do
        it 'updates and redirects to discussion' do
          put :update, id: discussion.id, discussion: { title: 'new' }
          discussion.reload.title.should == 'new'
          response.should redirect_to discussion
        end
      end

      context 'with invalid attributes' do
        it 'renders edit' do
          put :update, id: discussion.id, discussion: { title: '' }
          discussion.reload.title.should == 'old'
          response.should render_template 'edit'
        end
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to root' do
        put :update, id: discussion.id, discussion: { title: 'new' }
        discussion.reload.title.should == 'old'
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: discussion.id, discussion: { title: 'new' }
        discussion.reload.title.should == 'old'
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'destroy' do
    let!(:discussion) { create :discussion }

    context 'when signed in as admin', :signed_in_as_admin do
      it 'destroys and redirects to discussions' do
        expect{
          delete :destroy, id: discussion.id
          response.should redirect_to discussions_path
        }.to change(Discussion, :count).by(-1)
      end
    end

     context 'when signed in', :signed_in do
      it 'redirects to root' do
        expect{
          delete :destroy, id: discussion.id
          response.should redirect_to root_path
        }.to change(Discussion, :count).by(0)
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: discussion.id
          response.should redirect_to new_user_session_path
        }.to change(Discussion, :count).by(0)
      end
    end
  end
end
