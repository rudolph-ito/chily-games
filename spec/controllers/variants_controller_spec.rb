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
    let(:valid_attributes) { {
      name: 'test',
      board_type: 'hexagonal',
      board_size: 6,
      number_of_pieces: 8
    } }

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
            post :create, variant: valid_attributes.merge(name: '')
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
    let(:variant) { create :variant, name: 'old' }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, name: 'old', user: current_user }

        context 'with valid attributes' do
          it 'updates and redirects to variant' do
            put :update, id: variant.id, variant: { name: 'new' }
            variant.reload.name.should == 'new'
            response.should redirect_to variant
          end
        end

        context 'with invalid attributes' do
          it 'renders edit' do
            put :update, id: variant.id, variant: { name: '' }
            variant.reload.name.should == 'old'
            response.should render_template 'edit'
          end
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          put :update, id: variant.id, variant: { name: 'new' }
          variant.reload.name.should == 'old'
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: variant.id, variant: { name: 'new' }
        variant.reload.name.should == 'old'
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

  describe 'preview' do
    context 'square board' do
      let(:variant) { create :variant_with_square_board }

      it 'returns the needed info to display the board' do
        get :preview, id: variant.id
        response.should be_success
        response.body.should be_json(
          board_type: variant.board_type,
          board_columns: variant.board_columns,
          board_rows: variant.board_rows,
        )
      end
    end

    context 'hexagonal board' do
      let(:variant) { create :variant_with_hexagonal_board }

      it 'returns the needed info to display the board' do
        get :preview, id: variant.id
        response.should be_success
        response.body.should be_json(
          board_type: variant.board_type,
          board_size: variant.board_size
        )
      end
    end

    context 'with piece type' do
      let(:variant) { create :variant_with_square_board, board_rows: 3, board_columns: 3 }
      let(:piece_type) { create :piece_type }
      let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1 }

      it 'returns the board info and the valid plies for the piece' do
        get :preview, id: variant.id, piece_type_id: piece_type.id
        response.should be_success
        response.body.should be_json(
          board_type: variant.board_type,
          board_columns: variant.board_columns,
          board_rows: variant.board_rows,
          color: "onyx",
          pieces: [{"coordinate"=>{"x"=>1, "y"=>1}, "piece_type_id"=>piece_type.id, "color"=>"onyx"}],
          valid_plies: [{"x"=>2, "y"=>1}, {"x"=>0, "y"=>1}, {"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}]
        )
      end
    end
  end
end
