require 'spec_helper'

describe Api::GamesController do
  describe 'setup_add' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }

          it 'succeeds' do
            put :setup_add, id: game.id, type: 'Piece', type_id: piece_type.id, coordinate: {'x'=>'0', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200

            piece = game.reload.initial_setup.get({'x'=>0, 'y'=>0}, Piece)
            expect(piece.type_id).to eql(piece_type.id)
            expect(piece.user_id).to eql(current_user.id)
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }

          it 'succeeds' do
            put :setup_add, id: game.id, type: 'Piece', type_id: piece_type.id, coordinate: {'x'=>'7', 'y'=>'7'}, format: :json
            expect(response.status).to eql 200

            piece = game.reload.initial_setup.get({'x'=>7, 'y'=>7}, Piece)
            expect(piece.type_id).to eql(piece_type.id)
            expect(piece.user_id).to eql(current_user.id)
          end
        end
      end
    end
  end
end
