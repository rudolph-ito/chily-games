require 'spec_helper'

describe Api::GamesController do
  render_views

  describe 'rules' do
    let(:game_parameters) { {} }
    let(:game) { create(:game, {variant: create(:variant_with_square_board)}.merge(game_parameters)) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          get :rules, id: game.id, format: :html
          expect(response.status).to eql 200
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          get :rules, id: game.id, format: :html
          expect(response.status).to eql 200
        end
      end
    end
  end
end
