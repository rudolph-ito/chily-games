require 'spec_helper'

describe Api::GamesController do
  render_views

  describe 'opponent_setup' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }

    let(:game_parameters) { {} }
    let(:game) { create :game, { variant: variant }.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>7}, type_id: piece_type.id, user_id: game.onyx_id}).call
      game.setup_complete(game.alabaster)
      game.setup_complete(game.onyx)
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          get :opponent_setup, id: game.id, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({pieces: [{ piece_type_id: piece_type.id, coordinate: {'x'=>7, 'y'=>7}, color: 'onyx'}], terrains: []})
        end
      end
    end
  end
end
