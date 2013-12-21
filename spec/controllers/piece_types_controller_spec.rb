require 'spec_helper'

describe PieceTypesController do
  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end

  describe 'new' do
    context 'when signed in as admin', :signed_in_as_admin do
      it 'succeeds' do
        get :index
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
    let(:valid_attributes) { {
      alabaster_image: Rack::Test::UploadedFile.new('spec/support/fake_image.svg'),
      name: 'test',
      onyx_image: Rack::Test::UploadedFile.new('spec/support/fake_image.svg')
    } }

    context 'when signed in as admin', :signed_in_as_admin do
      context 'with valid attributes' do
        it 'creates and redirects' do
          expect {
            post :create, piece_type: valid_attributes
            response.should redirect_to PieceType.last
          }.to change(PieceType, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, piece_type: valid_attributes.merge(name: '')
            response.should render_template 'new'
          }.to change(PieceType, :count).by(0)
        end
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to login' do
        expect {
          post :create, piece_type: valid_attributes
          response.should redirect_to root_path
        }.to change(PieceType, :count).by(0)
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, piece_type: valid_attributes
          response.should redirect_to new_user_session_path
        }.to change(PieceType, :count).by(0)
      end
    end
  end

  describe 'edit' do
    let(:piece_type) { create :piece_type }

    context 'when signed in as admin', :signed_in_as_admin do
      it 'succeeds' do
        get :edit, id: piece_type.id
        response.status.should == 200
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to root' do
        get :edit, id: piece_type.id
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: piece_type.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:piece_type) { create :piece_type, name: 'old' }

    context 'when signed in as admin', :signed_in_as_admin do
      context 'with valid attributes' do
        it 'updates and redirects to piece_type' do
          put :update, id: piece_type.id, piece_type: { name: 'new' }
          piece_type.reload.name.should == 'new'
          response.should redirect_to piece_type
        end
      end

      context 'with invalid attributes' do
        it 'renders edit' do
          put :update, id: piece_type.id, piece_type: { name: '' }
          piece_type.reload.name.should == 'old'
          response.should render_template 'edit'
        end
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to root' do
        put :update, id: piece_type.id, piece_type: { name: 'new' }
        piece_type.reload.name.should == 'old'
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: piece_type.id, piece_type: { name: 'new' }
        piece_type.reload.name.should == 'old'
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'destroy' do
    let!(:piece_type) { create :piece_type }

    context 'when signed in as admin', :signed_in_as_admin do
      it 'destroys and redirects to piece_types' do
        expect{
          delete :destroy, id: piece_type.id
          response.should redirect_to piece_types_path
        }.to change(PieceType, :count).by(-1)
      end
    end

     context 'when signed in', :signed_in do
      it 'redirects to root' do
        expect{
          put :update, id: piece_type.id, piece_type: { name: 'new' }
          response.should redirect_to root_path
        }.to change(PieceType, :count).by(0)
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: piece_type.id
          response.should redirect_to new_user_session_path
        }.to change(PieceType, :count).by(0)
      end
    end
  end
end
