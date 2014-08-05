require 'spec_helper'

describe Api::GamesController do
  describe 'resign' do
    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'play'}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          put :resign, id: game.id, format: :json
          expect(response.status).to eql 200
          expect(game.reload.action).to eql 'complete'
          expect(game.action_to_id).to eql game.onyx_id
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          put :resign, id: game.id, format: :json
          expect(response.status).to eql 200
          expect(game.reload.action).to eql 'complete'
          expect(game.action_to_id).to eql game.alabaster_id
        end
      end
    end
  end
end
