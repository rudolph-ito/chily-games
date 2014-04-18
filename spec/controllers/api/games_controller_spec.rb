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
            expect(piece.type_id).to eql(piece_type.id)
            expect(piece.user_id).to eql(current_user.id)
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }

          it 'succeeds' do
            put :setup_add, id: game.id, type: 'Piece', type_id: piece_type.id, coordinate: {'x'=>'7', 'y'=>'7'}, format: :json
            expect(response.status).to eql 200

            piece = game.reload.initial_setup.get({'x'=>7, 'y'=>7}, Piece)
            expect(piece.type_id).to eql(piece_type.id)
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
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: piece_type.id, user_id: current_user.id}).call }

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
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>7}, type_id: piece_type.id, user_id: current_user.id}).call }

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
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>0}, type_id: piece_type.id, user_id: current_user.id}).call }

          it 'succeeds' do
            put :setup_remove, id: game.id, type: 'Piece', coordinate: {'x'=>'0', 'y'=>'0'}, format: :json
            expect(response.status).to eql 200
            expect(game.reload.initial_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }
          before { AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>7, 'y'=>7}, type_id: piece_type.id, user_id: current_user.id}).call }

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

  describe 'valid_plies' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 5, board_columns: 5 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil }

    let(:game_parameters) { {} }
    let(:game) { create :game, {variant: variant}.merge(game_parameters) }

    before do
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>1}, type_id: piece_type.id, user_id: game.alabaster_id}).call
      AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>3}, type_id: piece_type.id, user_id: game.onyx_id}).call
    end

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'during setup' do
          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>0, 'y'=>1}, type: 'movement', format: :json
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
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json([{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>3}, {"x"=>0, "y"=>0}])
          end
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        context 'during setup' do
          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'movement', format: :json
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
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json([{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>1}])
          end
        end
      end
    end
  end

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

  describe 'create_ply' do
    let(:piece_type) { create :piece_type, name: 'King' }
    let(:variant) { create :variant, board_type: 'square', board_rows: 2, board_columns: 3 }
    let(:piece_rule_parameters) { {} }
    let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 1}.merge(piece_rule_parameters) }

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
          context 'movement only' do
            let(:piece_rule_parameters) { { capture_type: 'movement' } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'1', 'y'=>'0'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>1, 'y'=>0}, range_capture: nil, action: 'play', action_to_id: game.onyx_id})

              game.reload
              expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
              expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).not_to be_nil
            end
          end

          context 'range capture only' do
            let(:piece_rule_parameters) { { capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 2 } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, range_capture: {'x'=>'2', 'y'=>'0'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: nil, range_capture: {'x'=>2, 'y'=>0}, action: 'play', action_to_id: game.onyx_id})
            end
          end

          context 'movement and range capture' do
            let(:piece_rule_parameters) { { capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 1, move_and_range_capture: true } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=> '1', 'y'=>'0'}, range_capture: {'x'=>'2', 'y'=>'0'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>1, 'y'=>0}, range_capture: {'x'=>2, 'y'=>0}, action: 'play', action_to_id: game.onyx_id})

              game.reload
              expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
              expect(game.current_setup.get({'x'=>1, 'y'=>0}, Piece)).not_to be_nil
            end
          end

          context 'capturing king' do
            let(:piece_rule_parameters) { { capture_type: 'movement' } }

            it 'succeeds' do
              put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'0', 'y'=>'1'}, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, from: {'x'=>0, 'y'=>0}, to: {'x'=>0, 'y'=>1}, range_capture: nil, action: "complete", action_to_id: game.alabaster_id})

              game.reload
              expect(game.current_setup.get({'x'=>0, 'y'=>0}, Piece)).to be_nil
              expect(game.current_setup.get({'x'=>0, 'y'=>1}, Piece)).not_to be_nil
            end
          end
        end

        context 'invalid' do
          let(:piece_rule_parameters) { { capture_type: 'movement' } }

          it 'fails' do
            put :create_ply, id: game.id, from: {'x'=>'0', 'y'=>'0'}, to: {'x'=>'2', 'y'=>'0'}, format: :json
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
