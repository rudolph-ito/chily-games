require 'spec_helper'

describe Api::GamesController do
  describe 'abort' do
    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup'}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          expect {
            put :abort, id: game.id, format: :json
            expect(response.status).to eql 200
          }.to change(Game, :count).by(-1)
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          expect {
            put :abort, id: game.id, format: :json
            expect(response.status).to eql 200
          }.to change(Game, :count).by(-1)
        end
      end
    end
  end
end
