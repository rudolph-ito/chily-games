require 'spec_helper'

describe Api::GamesController do
  describe 'setup_remove_piece' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: piece_type.id, user_id: current_user.id}).call }

          it 'succeeds' do
            put :setup_remove, id: game.id, type: 'Piece', coordinate: {'x'=>'0', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(game.reload.initial_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>7}, type_id: piece_type.id, user_id: current_user.id}).call }

          it 'succeeds' do
            put :setup_remove, id: game.id, type: 'Piece', coordinate: {'x'=>'7', 'y'=>'7'}, format: :json
            expect(response.status).to eql 200
            expect(game.reload.initial_setup.get({'x'=>7, 'y'=>7}, Piece)).to be_nil
          end
        end
      end
    end
  end
end
