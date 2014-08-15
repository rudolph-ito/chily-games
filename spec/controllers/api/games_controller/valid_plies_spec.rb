require 'spec_helper'

describe Api::GamesController do
  describe 'valid_plies', :signed_in do
    context 'no piece ranks' do
      let(:piece_type) { create :piece_type }
      let(:variant) { create :variant, board_type: 'square', board_rows: 5, board_columns: 5 }
      let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type}.merge(piece_rule_parameters) }
      let(:game_parameters) { {} }
      let(:game) { create :game, {variant: variant}.merge(game_parameters) }

      before do
        AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>1}, type_id: piece_type.id, user_id: game.alabaster_id}).call
        AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>3}, type_id: piece_type.id, user_id: game.onyx_id}).call
      end

      context 'movement' do
        let(:piece_rule_parameters) { { capture_type: 'movement', movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil } }

        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }

          context 'during setup' do
            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>0, 'y'=>1}, type: 'movement', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'type' => 'movement',
                'origin' => {'x'=>0, 'y'=>1},
                'valid' => [{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>0}],
                'reachable' => []
              )
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
              expect(response.body).to be_json(
                'type' => 'movement',
                'origin' => {'x'=>0, 'y'=>1},
                'valid' => [{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>0}, {"x"=>0, "y"=>3}],
                'reachable' => []
              )
            end
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }

          context 'during setup' do
            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'movement', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'type' => 'movement',
                'origin' => {'x'=>0, 'y'=>3},
                'valid' => [{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>1}, {"x"=>0, "y"=>0}],
                'reachable' => []
              )
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
              expect(response.body).to be_json(
                'type' => 'movement',
                'origin' => {'x'=>0, 'y'=>3},
                'valid' => [{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>1}],
                'reachable' => []
              )
            end
          end
        end
      end

      context 'range' do
        let(:piece_rule_parameters) { { capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil } }

        context 'as alabaster' do
          let(:game_parameters) { { alabaster: current_user } }

          context 'during setup' do
            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>0, 'y'=>1}, type: 'range', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'type' => 'range',
                'origin' => {'x'=>0, 'y'=>1},
                'valid' => [],
                'reachable' => [{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>0}]
              )
            end
          end

          context 'during play' do
            before do
              game.setup_complete(game.alabaster)
              game.setup_complete(game.onyx)
            end

            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'range', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'type' => 'range',
                'origin' => {'x'=>0, 'y'=>1},
                'valid' => [{"x"=>0, "y"=>3}],
                'reachable' => [{"x"=>1, "y"=>1}, {"x"=>2, "y"=>1}, {"x"=>3, "y"=>1}, {"x"=>4, "y"=>1}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>0}]
              )
            end
          end
        end

        context 'as onyx' do
          let(:game_parameters) { { onyx: current_user } }

          context 'during setup' do
            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'range', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'type' => 'range',
                'origin' => {'x'=>0, 'y'=>3},
                'valid' => [],
                'reachable' => [{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}, {"x"=>0, "y"=>1}, {"x"=>0, "y"=>0}]
              )
            end
          end

          context 'during play' do
            before do
              game.setup_complete(game.alabaster)
              game.setup_complete(game.onyx)
            end

            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'3'}, type: 'range', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'type' => 'range',
                'origin' => {'x'=>0, 'y'=>3},
                'valid' => [{"x"=>0, "y"=>1}],
                'reachable' => [{"x"=>1, "y"=>3}, {"x"=>2, "y"=>3}, {"x"=>3, "y"=>3}, {"x"=>4, "y"=>3}, {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2}]
              )
            end
          end
        end
      end
    end

    context 'with piece ranks' do
      let(:piece_type1) { create :piece_type }
      let(:piece_type2) { create :piece_type }

      let(:variant) { create :variant, board_type: 'square', board_rows: 5, board_columns: 5, piece_ranks: true, support_type: support_type }

      let!(:piece_rule1) { create :piece_rule, variant: variant, piece_type: piece_type1, movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil, attack_rank: attack_rank }
      let!(:piece_rule2) { create :piece_rule, variant: variant, piece_type: piece_type2, movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil, defense_rank: defense_rank }

      let(:game_parameters) { {} }
      let(:game) { create :game, variant: variant, alabaster: current_user }

      before do
        AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>0, 'y'=>1}, type_id: piece_type1.id, user_id: game.alabaster_id}).call
        AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>4, 'y'=>1}, type_id: piece_type1.id, user_id: game.alabaster_id}).call
        AddToInitialSetup.new(game, Piece, {coordinate: {'x'=>2, 'y'=>3}, type_id: piece_type2.id, user_id: game.onyx_id}).call
        game.setup_complete(game.alabaster)
        game.setup_complete(game.onyx)
      end

      context 'no support' do
        let(:support_type) { 'none' }

        context 'enemy piece has lower rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 1 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
              'reachable' => []
            )
          end
        end

        context 'enemy piece has same rank' do
          let(:attack_rank) { 1 }
          let(:defense_rank) { 1 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
              'reachable' => []
            )
          end
        end

        context 'enemy piece has higher rank' do
          let(:attack_rank) { 1 }
          let(:defense_rank) { 2 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}],
              'reachable' => [{"x"=>2, "y"=>3}]
            )
          end
        end
      end

      context 'binary support' do
        let(:support_type) { 'binary' }

        context 'enemy piece rank lower than supported rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 2 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
              'reachable' => []
            )
          end
        end

        context 'enemy piece rank same as than supported rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 3 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
              'reachable' => []
            )
          end
        end

        context 'enemy piece rank higher than supported rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 4 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}],
              'reachable' => [{"x"=>2, "y"=>3}]
            )
          end
        end
      end

      context 'sum support' do
        let(:support_type) { 'sum' }

        context 'enemy piece rank lower than supported rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 3 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
              'reachable' => []
            )
          end

          context 'ally in enemy territory' do
            before do
              piece = game.get_piece(game.alabaster, {'x'=>4, 'y'=>1})
              CreatePly.new(game, piece, {'x'=>3, 'y'=>4}, nil).call
            end

            it 'succeeds' do
              get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json(
                'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
                'reachable' => []
              )
            end
          end
        end

        context 'enemy piece rank same as than supported rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 4 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}, {"x"=>2, "y"=>3}],
              'reachable' => []
            )
          end
        end

        context 'enemy piece rank higher than supported rank' do
          let(:attack_rank) { 2 }
          let(:defense_rank) { 5 }

          it 'succeeds' do
            get :valid_plies, id: game.id, coordinate: {'x'=>'0', 'y'=>'1'}, type: 'movement', format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(
              'type' => 'movement',
              'origin' => {'x'=>0, 'y'=>1},
              'valid' => [{"x"=>1, "y"=>2}, {"x"=>1, "y"=>0}],
              'reachable' => [{"x"=>2, "y"=>3}]
            )
          end
        end
      end
    end
  end
end
