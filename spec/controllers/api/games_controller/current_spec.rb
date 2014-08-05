require 'spec_helper'

describe Api::GamesController do
  render_views

  describe 'current' do
    let(:game_parameters) { {} }
    let!(:game) { create(:game, game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'returns game id' do
          get :current, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({id: game.id})
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'returns game id' do
          get :current, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({id: game.id})
        end
      end

      context 'not in game' do
        it 'returns nil' do
          get :current, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({id: nil})
        end
      end
    end
  end
end
