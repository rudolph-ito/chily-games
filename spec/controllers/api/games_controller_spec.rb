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

  describe 'show' do
    let(:game_parameters) { {} }
    let(:game) { create(:game, {variant: create(:variant_with_square_board)}.merge(game_parameters)) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          get :show, id: game.id, format: :json
          expect(response.status).to eql 200
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          get :show, id: game.id, format: :json
          expect(response.status).to eql 200
        end
      end
    end
  end

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

  describe 'setup_add' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
      let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }

          it 'succeeds' do
            expect {
              put :setup_add, id: game.id, type: 'piece', type_id: piece_type.id, coordinate: {'x' => '0', 'y' => '0'}, format: :json
              expect(response.status).to eql 200
            }.to change(Piece, :count).by(1)
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }

          it 'succeeds' do
            expect {
              put :setup_add, id: game.id, type: 'piece', type_id: piece_type.id, coordinate: {'x' => '7', 'y' => '7'}, format: :json
              expect(response.status).to eql 200
            }.to change(Piece, :count).by(1)
          end
        end
      end
    end
  end

  describe 'setuo_move' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
      let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }
          let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }

          it 'succeeds' do
            put :setup_move, id: game.id, type: 'piece', from: {'x' => '0', 'y' => '0'}, to: {'x' => '2', 'y' => '2'}, format: :json
            expect(response.status).to eql 200
            expect(piece.reload.coordinate).to eql({'x' => 2, 'y' => 2})
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }
          let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }

          it 'succeeds' do
            put :setup_move, id: game.id, type: 'piece', from: {'x' => '7', 'y' => '7'}, to: {'x' => '5', 'y' => '5'}, format: :json
            expect(response.status).to eql 200
            expect(piece.reload.coordinate).to eql({'x' => 5, 'y' => 5})
          end
        end
      end
    end
  end

  describe 'setup_remove_piece' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
      let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }
          let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }

          it 'succeeds' do
            expect {
              put :setup_remove, id: game.id, type: 'piece', coordinate: {'x' => '0', 'y' => '0'}, format: :json
              expect(response.status).to eql 200
            }.to change(Piece, :count).by(-1)
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }
          let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }

          it 'succeeds' do
            expect {
              put :setup_remove, id: game.id, type: 'piece', coordinate: {'x' => '7', 'y' => '7'}, format: :json
              expect(response.status).to eql 200
            }.to change(Piece, :count).by(-1)
          end
        end
      end
    end
  end

  describe 'setup_complete' do
    let(:piece_type) { create :piece_type, name: 'Dragon' }
    let(:terrain_type) { create :terrain_type, name: 'Mountain' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8, number_of_pieces: 2 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, count_minimum: 2, count_maximum: 2}
    let!(:terrain_rule) { create :terrain_rule, variant: variant, terrain_type: terrain_type, count: 1}

    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'no errors' do
          let!(:piece1) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }
          let!(:piece2) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '1'} }
          let!(:terrain) { create :terrain, game: game, user: current_user, terrain_type: terrain_type, coordinate: {'x' => '0', 'y' => '2'} }

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
              expect(response.body).to be_json({success: true, action: 'move', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ["Please place 2 pieces. You placed 0.", "Please place 2 dragons. You placed 0.", "Please place 1 mountain. You placed 0."]})
          end
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        context 'no errors' do
          let!(:piece1) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }
          let!(:piece2) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '6'} }
          let!(:terrain) { create :terrain, game: game, user: current_user, terrain_type: terrain_type, coordinate: {'x' => '7', 'y' => '5'} }

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
              expect(response.body).to be_json({success: true, action: 'move', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ["Please place 2 pieces. You placed 0.", "Please place 2 dragons. You placed 0.", "Please place 1 mountain. You placed 0."]})
          end
        end
      end
    end
  end

  describe 'opponent_setup' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8, number_of_pieces: 2 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

    let(:game_parameters) { {} }
    let(:game) { create :game, { variant: variant, action: 'move' }.merge(game_parameters) }
    let!(:piece) { create :piece, game: game, user: game.onyx, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          get :opponent_setup, id: game.id, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({pieces: [{ piece_type_id: piece_type.id, coordinate: {'x' => 7, 'y' => 7}, color: 'onyx'}], terrains: []})
        end
      end
    end
  end

  describe 'valid_piece_moves' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8, number_of_pieces: 2 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

    let(:game_parameters) { {} }
    let(:game) { create :game, {variant: variant}.merge(game_parameters) }
    let!(:piece) { create :piece, game: game, user: game.alabaster, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          get :valid_piece_moves, id: game.id, coordinate: piece.coordinate, format: :json
          expect(response.status).to eql 200
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          get :valid_piece_moves, id: game.id, coordinate: piece.coordinate, format: :json
          expect(response.status).to eql 200
        end
      end
    end
  end

  describe 'piece_move' do
    let(:piece_type) { create :piece_type, name: 'King' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1 }

    let(:game_parameters) { {} }
    let(:game) { create :game, {action: 'move', variant: variant}.merge(game_parameters) }
    let!(:piece) { create :piece, game: game, user: game.alabaster, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }
    let!(:opponent_piece) { create :piece, game: game, user: game.onyx, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '1'} }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user, action_to: current_user } }

        context 'valid move' do
          it 'succeeds' do
            put :piece_move, id: game.id, from: {'x' => '0', 'y' => '0'}, to: {'x' => '1', 'y' => '0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: true, from: {'x' => 0, 'y' => 0}, to: {'x' => 1, 'y' => 0}, action: "move", action_to_id: game.onyx_id})
            expect(piece.reload.coordinate).to eql({'x' => 1, 'y' => 0})
          end

          context 'taking king' do
            it 'succeeds' do
              put :piece_move, id: game.id, from: {'x' => '0', 'y' => '0'}, to: {'x' => '0', 'y' => '1'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x' => 0, 'y' => 0}, to: {'x' => 0, 'y' => 1}, action: "complete", action_to_id: game.alabaster_id})
              expect(piece.reload.coordinate).to eql({'x' => 0, 'y' => 1})
            end
          end
        end

        context 'invalid_move' do
          it 'fails' do
            put :piece_move, id: game.id, from: piece.coordinate, to: {'x' => '2', 'y' => '0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false})
            expect(piece.reload.coordinate).to eql({'x' => 0, 'y' => 0})
            expect(game.reload.action_to).to eql(game.alabaster)
          end
        end
      end
    end
  end

  describe 'resign' do
    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'move'}.merge(game_parameters) }

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
