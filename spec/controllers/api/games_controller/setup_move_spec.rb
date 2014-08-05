require 'spec_helper'

describe Api::GamesController do
  describe 'setup_move' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
      let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: piece_type.id, user_id: current_user.id}).call }

          it 'succeeds' do
            put :setup_move, id: game.id, type: 'Piece', from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'2', 'y'=>'2'}, format: :json
            expect(response.status).to eql 200

            game.reload
            expect(game.initial_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
            expect(game.initial_setup.get({'x'=>2, 'y'=>2}, Piece)).not_to be_nil
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>7}, type_id: piece_type.id, user_id: current_user.id}).call }

          it 'succeeds' do
            put :setup_move, id: game.id, type: 'Piece', from: {'x'=>'7', 'y'=>'7'}, to: {'x'=>'5', 'y'=>'5'}, format: :json
            expect(response.status).to eql 200

            game.reload
            expect(game.initial_setup.get({'x'=>7, 'y'=>7}, Piece)).to be_nil
            expect(game.initial_setup.get({'x'=>5, 'y'=>5}, Piece)).not_to be_nil
          end
        end
      end
    end
  end
end
