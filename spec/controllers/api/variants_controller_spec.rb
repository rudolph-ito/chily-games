require 'spec_helper'

describe Api::VariantsController do
  render_views

  describe 'review' do
    let(:variant) { create :variant }

    context 'signed in', :signed_in do
      context 'no rating or comment' do
        it 'return current rating and comment' do
          get :review, id: variant.id, format: :json
          expect(response.body).to be_json({rating: nil, comment: nil})
        end
      end

      context 'rating exists' do
        let!(:rating) { create(:rating, value: 5, variant: variant, user: current_user) }

        it 'return current rating and comment' do
          get :review, id: variant.id, format: :json
          expect(response.body).to be_json({rating: 5, comment: nil})
        end
      end

      context 'comment exists' do
        let(:topic) { variant.topics.find_by(title: 'Reviews') }
        let!(:comment) { create(:comment, text: 'The dragon is too weak', topic: topic, user: current_user) }

        it 'return current rating and comment' do
          get :review, id: variant.id, format: :json
          expect(response.body).to be_json({rating: nil, comment: 'The dragon is too weak'})
        end
      end

      context 'rating and comment exist' do
        let!(:rating) { create(:rating, value: 5, variant: variant, user: current_user) }
        let(:topic) { variant.topics.find_by(title: 'Reviews') }
        let!(:comment) { create(:comment, text: 'The dragon is too weak', topic: topic, user: current_user) }

        it 'return current rating and comment' do
          get :review, id: variant.id, format: :json
          expect(response.body).to be_json({rating: 5, comment: 'The dragon is too weak'})
        end
      end
    end

    context 'not signed in' do
      it 'returns 401' do
        get :review, id: variant.id, format: :json
        expect(response.status).to eql 401
      end
    end
  end

  describe 'update_review' do
    let(:variant) { create :variant }
    let(:params) { { id: variant.id, format: :json, rating: '6', comment: 'The dragon is too strong' } }

    context 'signed in', :signed_in do
      let(:update_review) { double :update_review, call: nil }
      before { UpdateReview.stub(:new).with(variant, current_user, '6', 'The dragon is too strong').and_return(update_review) }

      it 'calls UpdateReview' do
        put :update_review, params
        expect(response.status).to eql 204
        expect(update_review).to have_received(:call)
      end
    end

    context 'not signed in' do
      it 'returns 401' do
        put :update_review, params
        expect(response.status).to eql 401
      end
    end
  end

  describe 'preview' do
    context 'square board' do
      let(:variant) { create :variant_with_square_board }

      it 'returns the needed info to display the board' do
        get :preview, id: variant.id, format: :json
        expect(response).to be_success
        expect(response.body).to be_json(
          color: 'onyx',
          options: {
            board_type: variant.board_type,
            board_columns: variant.board_columns,
            board_rows: variant.board_rows,
          }
        )
      end
    end

    context 'hexagonal board' do
      let(:variant) { create :variant_with_hexagonal_board }

      it 'returns the needed info to display the board' do
        get :preview, id: variant.id, format: :json
        expect(response).to be_success
        expect(response.body).to be_json(
          color: 'onyx',
          options: {
            board_type: variant.board_type,
            board_size: variant.board_size
          }
        )
      end
    end

    context 'with piece type' do
      let(:variant) { create :variant_with_square_board, board_rows: 3, board_columns: 3 }
      let(:piece_type) { create :piece_type }
      let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1 }

      it 'returns the board info and the valid plies for the piece' do
        get :preview, id: variant.id, piece_type_id: piece_type.id, type: 'movement', format: :json
        expect(response).to be_success
        expect(response.body).to be_json(
          color: 'onyx',
          options: {
            board_type: variant.board_type,
            board_columns: variant.board_columns,
            board_rows: variant.board_rows,
          },
          pieces: [{"coordinate"=>{"x"=>1, "y"=>1}, "piece_type_id"=>piece_type.id, "color"=>"onyx"}],
          valid_plies: {type: 'movement', coordinates: [{"x"=>2, "y"=>1}, {"x"=>0, "y"=>1}, {"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}]}
        )
      end
    end
  end
end
