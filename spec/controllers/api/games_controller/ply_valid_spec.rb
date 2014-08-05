require 'spec_helper'

describe Api::GamesController do
  describe 'ply_valid' do
    let(:piece_type) { create :piece_type, name: 'King' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 2, board_columns: 3 }
    let(:piece_rule_parameters) { {} }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1, capture_type: 'movement' }

    let(:game_parameters) { {} }
    let(:game) { create :game, {action: 'play', variant: variant}.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: piece_type.id, user_id: game.alabaster_id}).call
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>1}, type_id: piece_type.id, user_id: game.onyx_id}).call
      game.setup_complete(game.onyx)
      game.setup_complete(game.alabaster)
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'valid' do
          it 'succeeds' do
            put :ply_valid, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'1', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to eql 'true'
          end
        end

        context 'invalid' do
          it 'fails' do
            put :ply_valid, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'2', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to eql 'false'
          end
        end
      end
    end
  end
end
