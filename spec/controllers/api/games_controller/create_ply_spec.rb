require 'spec_helper'

describe Api::GamesController do
  describe 'create_ply' do
    let(:king_piece_type) { create :piece_type, name: 'King' }
    let(:rabble_piece_type) { create :piece_type, name: 'Rabble' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 3, board_columns: 3 }
    let(:piece_rule_parameters) { {} }
    let!(:king_piece_rule) { create :piece_rule, {variant: variant, piece_type: king_piece_type, movement_type: 'orthogonal_or_diagonal_line', movement_minimum: 1, movement_maximum: 2}.merge(piece_rule_parameters) }
    let!(:rabble_piece_rule) { create :piece_rule, variant: variant, piece_type: rabble_piece_type }

    let(:game_parameters) { {} }
    let(:game) { create :game, {action: 'play', variant: variant}.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: king_piece_type.id, user_id: game.alabaster_id}).call
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>2}, type_id: rabble_piece_type.id, user_id: game.onyx_id}).call
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>2, 'y'=>2}, type_id: king_piece_type.id, user_id: game.onyx_id}).call
      game.setup_complete(game.onyx)
      game.setup_complete(game.alabaster)
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'valid' do
          context 'movement' do
            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'0', 'y'=>'1'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({
                success: true,
                action: 'play', action_to_id: game.onyx_id,
                ply: {
                  piece: {type_id: king_piece_type.id, color: 'alabaster'},
                  captured_piece: nil,
                  from: {'x'=>0, 'y'=>0}, to: {'x'=>0, 'y'=>1}, range_capture: nil
                }
              })
            end
          end

          context 'movement with capture' do
            let(:piece_rule_parameters) { { capture_type: 'movement' } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'0', 'y'=>'2'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({
                success: true,
                action: 'play', action_to_id: game.onyx_id,
                ply: {
                  piece: {type_id: king_piece_type.id, color: 'alabaster'},
                  captured_piece: {type_id: rabble_piece_type.id, color: 'onyx'},
                  from: {'x'=>0, 'y'=>0}, to: {'x'=>0, 'y'=>2}, range_capture: nil
                }
              })
            end
          end

          context 'range capture only' do
            let(:piece_rule_parameters) { { capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 2 } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, range_capture: {'x'=>'0', 'y'=>'2'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({
                success: true,
                action: 'play', action_to_id: game.onyx_id,
                ply: {
                  piece: {type_id: king_piece_type.id, color: 'alabaster'},
                  captured_piece: {type_id: rabble_piece_type.id, color: 'onyx'},
                  from: {'x'=>0, 'y'=>0}, to: nil, range_capture: {'x'=>0, 'y'=>2}
                }
              })
            end
          end

          context 'movement and range capture' do
            let(:piece_rule_parameters) { { capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 1, move_and_range_capture: true } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=> '0', 'y'=>'1'}, range_capture: {'x'=>'0', 'y'=>'2'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({
                success: true,
                action: 'play', action_to_id: game.onyx_id,
                ply: {
                  piece: {type_id: king_piece_type.id, color: 'alabaster'},
                  captured_piece: {type_id: rabble_piece_type.id, color: 'onyx'},
                  from: {'x'=>0, 'y'=>0}, to: {'x'=>0, 'y'=>1}, range_capture: {'x'=>0, 'y'=>2}
                }
              })
            end
          end

          context 'capturing king' do
            let(:piece_rule_parameters) { { capture_type: 'movement' } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'2', 'y'=>'2'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({
                success: true,
                action: 'complete', action_to_id: game.alabaster_id,
                ply: {
                  piece: {type_id: king_piece_type.id, color: 'alabaster'},
                  captured_piece: {type_id: king_piece_type.id, color: 'onyx'},
                  from: {'x'=>0, 'y'=>0}, to: {'x'=>2, 'y'=>2}, range_capture: nil
                }
              })
            end
          end
        end

        context 'invalid' do
          let(:piece_rule_parameters) { { capture_type: 'movement' } }

          it 'fails' do
            put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'1', 'y'=>'2'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false})
          end
        end
      end
    end
  end
end
