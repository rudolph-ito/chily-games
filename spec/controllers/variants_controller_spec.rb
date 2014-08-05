require 'spec_helper'

describe VariantsController do
  describe 'index' do
    it 'succeeds' do
      get :index
      expect(response.status).to eql 200
    end
  end

  describe 'new' do
    context 'when signed in', :signed_in do
      context 'as a creator' do
        let(:current_user_params) { { creator: true } }

        context 'without a variant' do
          it 'succeeds' do
            get :new
            expect(response.status).to eql 200
          end
        end

        context 'with a variant' do
          let!(:variant) { create(:variant, user: current_user) }

          it 'redirects to root_path' do
            get :new
            expect(response).to redirect_to root_path
          end
        end
      end

      context 'not as a creator' do
        it 'redirects to root_path' do
          get :new
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :new
        expect(response).to redirect_to new_user_session_path
      end
    end
  end

  describe 'create' do
    let(:valid_attributes) { { board_type: 'hexagonal', board_size: 6, piece_ranks: false } }

    context 'when signed in', :signed_in do
      context 'as a creator' do
        let(:current_user_params) { { creator: true } }
        context 'without a variant' do
          context 'with valid attributes' do
            it 'creates and redirects' do
              expect {
                post :create, variant: valid_attributes
                expect(response).to redirect_to Variant.last
              }.to change(Variant, :count).by(1)
            end
          end

          context 'with invalid attributes' do
            it 'does not create and renders new' do
              expect {
                post :create, variant: valid_attributes.merge(board_type: '')
                expect(response).to render_template 'new'
              }.to change(Variant, :count).by(0)
            end
          end
        end

        context 'with a variant' do
          let!(:variant) { create(:variant, user: current_user) }

          it 'redirects to root_path' do
            get :new
            expect(response).to redirect_to root_path
          end
        end
      end

      context 'not as a creator' do
        it 'redirects to root_path' do
          get :new
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, variant: valid_attributes
          expect(response).to redirect_to new_user_session_path
        }.to change(Variant, :count).by(0)
      end
    end
  end

  describe 'show' do
    let(:variant) { create :variant }

    it 'succeeds' do
      get :show, id: variant.id
      expect(response.status).to eql 200
    end
  end

  describe 'edit' do
    let(:variant) { create :variant }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        it 'succeeds' do
          get :edit, id: variant.id
          expect(response.status).to eql 200
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          get :edit, id: variant.id
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: variant.id
        expect(response).to redirect_to new_user_session_path
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
            expect(variant.reload.board_rows).to eql 3
            expect(response).to redirect_to variant
          end
        end

        context 'with invalid attributes' do
          it 'renders edit' do
            put :update, id: variant.id, variant: { board_rows: '' }
            expect(variant.reload.board_rows).to eql 2
            expect(response).to render_template 'edit'
          end
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          put :update, id: variant.id, variant: { board_rows: 3 }
          expect(variant.reload.board_rows).to eql 2
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: variant.id, variant: { board_rows: 3 }
        expect(variant.reload.board_rows).to eql 2
        expect(response).to redirect_to new_user_session_path
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
            expect(response).to redirect_to variants_path
          }.to change(Variant, :count).by(-1)
        end
      end

      context 'for other variant' do
        it 'redirects to root_path' do
          expect{
            delete :destroy, id: variant.id
            expect(response).to redirect_to root_path
          }.to_not change(Variant, :count)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: variant.id
          expect(response).to redirect_to new_user_session_path
        }.to_not change(Variant, :count)
      end
    end
  end
end
