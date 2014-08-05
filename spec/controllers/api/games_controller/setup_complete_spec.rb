require 'spec_helper'

describe Api::GamesController do
  describe 'setup_complete' do
    let(:piece_type) { create :piece_type, name: 'Dragon' }
    let(:terrain_type) { create :terrain_type, name: 'Mountain' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, count: 2 }
    let!(:terrain_rule) { create :terrain_rule, variant: variant, terrain_type: terrain_type, count: 1}

    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'no errors' do
          before do
            AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: piece_type.id, user_id: current_user.id}).call
            AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>1}, type_id: piece_type.id, user_id: current_user.id}).call
            AddToInitialSetup.new(game, Terrain, {coordinate: {'x'=>0, 'y'=>2}, type_id: terrain_type.id, user_id: current_user.id}).call
          end

          context 'opponent not setup' do
            it 'returns success and change state to onyx - setup' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'setup', action_to_id: game.onyx_id})
            end
          end

          context 'opponent setup' do
            before { game.update_attributes(action_to: game.alabaster) }

            it 'returns success and change state to alabaster - move' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'play', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ['You have not placed all your pieces.']})
          end
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        context 'no errors' do
          before do
            AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>7}, type_id: piece_type.id, user_id: current_user.id}).call
            AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>6}, type_id: piece_type.id, user_id: current_user.id}).call
            AddToInitialSetup.new(game, Terrain, {coordinate: {'x'=>7, 'y'=>5}, type_id: terrain_type.id, user_id: current_user.id}).call
          end

          context 'opponent not setup' do
            it 'returns success and change state to alabaster - setup' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'setup', action_to_id: game.alabaster_id})
            end
          end

          context 'opponent setup' do
            before { game.update_attributes(action_to: game.onyx)}

            it 'returns success and change state to alabaster - move' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'play', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ['You have not placed all your pieces.']})
          end
        end
      end
    end
  end
end
