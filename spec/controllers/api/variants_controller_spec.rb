require 'spec_helper'

describe Api::VariantsController do
  render_views

  describe 'preview' do
    context 'square board' do
      let(:variant) { create :variant_with_square_board }

      it 'returns the needed info to display the board' do
        get :preview, id: variant.id, format: :json
        response.should be_success
        response.body.should be_json(
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
        response.should be_success
        response.body.should be_json(
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
        get :preview, id: variant.id, piece_type_id: piece_type.id, format: :json
        response.should be_success
        response.body.should be_json(
          color: 'onyx',
          options: {
            board_type: variant.board_type,
            board_columns: variant.board_columns,
            board_rows: variant.board_rows,
          },
          pieces: [{"coordinate"=>{"x"=>1, "y"=>1}, "piece_type_id"=>piece_type.id, "color"=>"onyx"}],
          valid_plies: [{"x"=>2, "y"=>1}, {"x"=>0, "y"=>1}, {"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}]
        )
      end
    end
  end
end
