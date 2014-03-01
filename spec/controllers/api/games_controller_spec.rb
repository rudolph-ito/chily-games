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

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }

          it 'succeeds' do
            put :setup_add, id: game.id, type: 'Piece', type_id: piece_type.id, coordinate: {'x'=>'0', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200

            piece = game.reload.initial_setup.get({'x'=>0, 'y'=>0}, Piece)
            expect(piece.piece_type_id).to eql(piece_type.id)
            expect(piece.user_id).to eql(current_user.id)
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }

          it 'succeeds' do
            put :setup_add, id: game.id, type: 'Piece', type_id: piece_type.id, coordinate: {'x'=>'7', 'y'=>'7'}, format: :json
            expect(response.status).to eql 200

            piece = game.reload.initial_setup.get({'x'=>7, 'y'=>7}, Piece)
            expect(piece.piece_type_id).to eql(piece_type.id)
            expect(piece.user_id).to eql(current_user.id)
          end
        end
      end
    end
  end

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
          before { AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>0}, game, piece_type.id, current_user.id)).call }

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
          before { AddToInitialSetup.new(game, Piece.new({'x'=>7, 'y'=>7}, game, piece_type.id, current_user.id)).call }

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

  describe 'setup_remove_piece' do
    context 'piece' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }

      let(:game_parameters) { {} }
      let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

      context 'when signed in', :signed_in do
        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }
          before { AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>0}, game, piece_type.id, current_user.id)).call }

          it 'succeeds' do
            put :setup_remove, id: game.id, type: 'Piece', coordinate: {'x'=>'0', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(game.reload.initial_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }
          before { AddToInitialSetup.new(game, Piece.new({'x'=>7, 'y'=>7}, game, piece_type.id, current_user.id)).call }

          it 'succeeds' do
            put :setup_remove, id: game.id, type: 'Piece', coordinate: {'x'=>'7', 'y'=>'7'}, format: :json
            expect(response.status).to eql 200
            expect(game.reload.initial_setup.get({'x'=>7, 'y'=>7}, Piece)).to be_nil
          end
        end
      end
    end
  end

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
            AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>0}, game, piece_type.id, current_user.id)).call
            AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>1}, game, piece_type.id, current_user.id)).call
            AddToInitialSetup.new(game, Terrain.new({'x'=>0, 'y'=>2}, game, terrain_type.id, current_user.id)).call
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
              expect(response.body).to be_json({success: true, action: 'move', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ["Please place 2 dragons. You placed 0.", "Please place 1 mountain. You placed 0."]})
          end
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        context 'no errors' do
          before do
            AddToInitialSetup.new(game, Piece.new({'x'=>7, 'y'=>7}, game, piece_type.id, current_user.id)).call
            AddToInitialSetup.new(game, Piece.new({'x'=>7, 'y'=>6}, game, piece_type.id, current_user.id)).call
            AddToInitialSetup.new(game, Terrain.new({'x'=>7, 'y'=>5}, game, terrain_type.id, current_user.id)).call
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
              expect(response.body).to be_json({success: true, action: 'move', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ["Please place 2 dragons. You placed 0.", "Please place 1 mountain. You placed 0."]})
          end
        end
      end
    end
  end

  describe 'opponent_setup' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }

    let(:game_parameters) { {} }
    let(:game) { create :game, { variant: variant }.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece.new({'x'=>7, 'y'=>7}, game, piece_type.id, game.onyx.id)).call
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

  describe 'valid_piece_moves' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 5, board_columns: 5 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil }

    let(:game_parameters) { {} }
    let(:game) { create :game, {variant: variant}.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>1}, game, piece_type.id, game.alabaster.id)).call
      AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>3}, game, piece_type.id, game.onyx.id)).call
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'during setup' do
          it 'succeeds' do
            get :valid_piece_moves, id: game.id, coordinate: {'x'=>0, 'y'=>1}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json([{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>0}])
          end
        end

        context 'during play' do
          before do
            game.setup_complete(game.alabaster)
            game.setup_complete(game.onyx)
          end

          it 'succeeds' do
            get :valid_piece_moves, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json([{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>3}, {"x"=>0, "y"=>0}])
          end
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        context 'during setup' do
          it 'succeeds' do
            get :valid_piece_moves, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json([{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>1}, {"x"=>0, "y"=>0}])
          end
        end

        context 'during play' do
          before do
            game.setup_complete(game.alabaster)
            game.setup_complete(game.onyx)
          end

          it 'succeeds' do
            get :valid_piece_moves, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json([{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>1}])
          end
        end
      end
    end
  end

  describe 'piece_move' do
    let(:piece_type) { create :piece_type, name: 'King' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 2, board_columns: 3 }
    let(:piece_rule_parameters) { {} }
    let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1}.merge(piece_rule_parameters) }

    let(:game_parameters) { {} }
    let(:game) { create :game, {action: 'move', variant: variant}.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>0}, game, piece_type.id, game.alabaster.id)).call
      AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>1}, game, piece_type.id, game.onyx.id)).call
      game.setup_complete(game.onyx)
      game.setup_complete(game.alabaster)
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user, action_to: current_user } }

        context 'valid move' do
          context 'movement capture' do
            let(:piece_rule_parameters) { { capture_type: 'movement' } }

            it 'succeeds' do
              put :piece_move, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'1', 'y'=>'0'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>1, 'y'=>0}, action: "move", action_to_id: game.onyx_id})

              game.reload
              expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
              expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).not_to be_nil
            end

            context 'taking king' do
              it 'succeeds' do
                put :piece_move, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'0', 'y'=>'1'}, format: :json
                expect(response.status).to eql 200
                expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>0, 'y'=>1}, action: "complete", action_to_id: game.alabaster_id})

                game.reload
                expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
                expect(game.current_setup.get({'x'=>0, 'y'=>1}, Piece)).not_to be_nil
              end
            end
          end

          context 'range_capture' do
            let(:piece_rule_parameters) { { capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 1 } }

            it 'fails and returns possible range captures' do
              put :piece_move, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'1', 'y'=>'0'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: false, from: {'x' => 0, 'y' => 0}, to: {'x' => 1, 'y' => 0}, range_captures: [{"x"=>2, "y"=>0}, {"x"=>0, "y"=>0}, {"x"=>1, "y"=>1}]})

              game.reload
              expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).not_to be_nil
              expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).to be_nil
            end
          end
        end

        context 'invalid_move' do
          it 'fails' do
            put :piece_move, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'2', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false})

            game.reload
            expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).not_to be_nil
            expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).to be_nil
          end
        end
      end
    end
  end

  describe 'piece_move_with_range_capture' do
    let(:piece_type) { create :piece_type, name: 'King' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 2, board_columns: 3 }
    let(:piece_rule_parameters) { {} }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1, capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 1 }

    let(:game_parameters) { {} }
    let(:game) { create :game, {variant: variant}.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece.new({'x'=>0, 'y'=>0}, game, piece_type.id, game.alabaster.id)).call
      AddToInitialSetup.new(game, Piece.new({'x'=>1, 'y'=>1}, game, piece_type.id, game.onyx.id)).call
      game.setup_complete(game.onyx)
      game.setup_complete(game.alabaster)
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user, action_to: current_user } }

        context 'no range_capture' do
          it 'succeeds' do
            put :piece_move_with_range_capture, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=> '1', 'y'=>'0'}, range_capture: nil, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>1, 'y'=>0}, range_capture: nil, action: "move", action_to_id: game.onyx_id})

            game.reload
            expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
            expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).not_to be_nil
          end
        end

        context 'valid move' do
          it 'succeeds' do
            put :piece_move_with_range_capture, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=> '1', 'y'=>'0'}, range_capture: {'x'=>'2', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>1, 'y'=>0}, range_capture: {'x'=>2, 'y'=>0}, action: "move", action_to_id: game.onyx_id})

            game.reload
            expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
            expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).not_to be_nil
          end

          context 'taking_king' do
            it 'succeeds' do
              put :piece_move_with_range_capture, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=> '1', 'y'=>'0'}, range_capture: {'x'=>'1', 'y'=>'1'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>1, 'y'=>0}, range_capture: {'x'=>1, 'y'=>1}, action: "complete", action_to_id: game.alabaster_id})

              game.reload
              expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
              expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).not_to be_nil
            end
          end
        end

        context 'invalid move' do
          it 'fails' do
            put :piece_move_with_range_capture, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'2', 'y'=>'0'}, range_capture: {'x'=>'3', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false})

            game.reload
            expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).not_to be_nil
            expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).to be_nil
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
