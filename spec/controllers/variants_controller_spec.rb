require 'spec_helper'

describe VariantsController do
  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end

  describe 'new' do
    context 'when signed in', :signed_in do
      it 'succeeds' do
        get :new
        response.status.should == 200
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
    let(:valid_attributes) { { board_type: 'hexagonal', board_size: 6 } }

    context 'when signed in', :signed_in do
      context 'with valid attributes' do
        it 'creates and redirects' do
          expect {
            post :create, variant: valid_attributes
            response.should redirect_to Variant.last
          }.to change(Variant, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, variant: valid_attributes.merge(board_type: '')
            response.should render_template 'new'
          }.to change(Variant, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, variant: valid_attributes
          response.should redirect_to new_user_session_path
        }.to change(Variant, :count).by(0)
      end
    end
  end

  describe 'show' do
    let(:variant) { create :variant }

    it 'succeeds' do
      get :show, id: variant.id
      response.status.should == 200
    end
  end

  describe 'edit' do
    let(:variant) { create :variant }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        it 'succeeds' do
          get :edit, id: variant.id
          response.status.should == 200
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          get :edit, id: variant.id
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: variant.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:variant) { create :variant, board_type: 'square', board_rows: 2 }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, board_type: 'square', board_rows: 2, user: current_user }

        context 'with valid attributes' do
          it 'updates and redirects to variant' do
            put :update, id: variant.id, variant: { board_rows: 3 }
            variant.reload.board_rows.should == 3
            response.should redirect_to variant
          end
        end

        context 'with invalid attributes' do
          it 'renders edit' do
            put :update, id: variant.id, variant: { board_rows: '' }
            variant.reload.board_rows.should == 2
            response.should render_template 'edit'
          end
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          put :update, id: variant.id, variant: { board_rows: 3 }
          variant.reload.board_rows.should == 2
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: variant.id, variant: { board_rows: 3 }
        variant.reload.board_rows.should == 2
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'destroy' do
    let!(:variant) { create :variant }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let!(:variant) { create :variant, user: current_user }

        it 'destroys and redirects to variants' do
          expect{
            delete :destroy, id: variant.id
            response.should redirect_to variants_path
          }.to change(Variant, :count).by(-1)
        end
      end

      context 'for other variant' do
        it 'redirects to root_path' do
          expect{
            delete :destroy, id: variant.id
            response.should redirect_to root_path
          }.to_not change(Variant, :count)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: variant.id
          response.should redirect_to new_user_session_path
        }.to_not change(Variant, :count)
      end
    end
  end
end
