require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/boards/square_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator/ply_evaluator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator/line_ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator/turn_ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/supported_rank.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'
require ROOT_DIRECTORY + '/app/game_storage/terrain.rb'
require ROOT_DIRECTORY + '/lib/coordinate_distance.rb'

describe PlyCalculator do
  let(:ply_calculator) { PlyCalculator.new(variant, board, coordinate_map) }
  let(:variant) { double :variant, piece_ranks: piece_ranks, allows_support?: false, support_type: 'none' }
  let(:piece_ranks) { false }
  let(:coordinate_map) { double :coordinate_map, get: nil }
  let(:piece) { double :piece, coordinate: coordinate, user_id: user1_id, type_id: 1, rule: piece_rule }
  let(:user1_id) { 1 }
  let(:user2_id) { 2 }
  let(:piece_rule) { double :piece_rule, piece_rule_parameters.merge(capture_type: capture_type, rank: 1) }
  let(:capture_type) { 'movement' }
  let(:supported_rank) { double(:supported_rank) }

  before do
    coordinate_map.stub(:get).with(coordinate, Piece).and_return(piece)
    SupportedRank.stub(:new).and_return(supported_rank)
  end

  context 'movement' do
    context 'hexagonal_board' do
      let(:board) { HexagonalBoard.new(3) }
      let(:coordinate) { {'x'=>3, 'y'=>3}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil} }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>2, "y"=>3}, {"x"=>1, "y"=>3}, {"x"=>0, "y"=>3},
            {"x"=>3, "y"=>2}, {"x"=>3, "y"=>1}, {"x"=>3, "y"=>0},
            {"x"=>4, "y"=>2}, {"x"=>5, "y"=>1}, {"x"=>6, "y"=>0},
            {"x"=>4, "y"=>3}, {"x"=>5, "y"=>3}, {"x"=>6, "y"=>3},
            {"x"=>3, "y"=>4}, {"x"=>3, "y"=>5}, {"x"=>3, "y"=>6},
            {"x"=>2, "y"=>4}, {"x"=>1, "y"=>5}, {"x"=>0, "y"=>6}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>2, "y"=>2},
            {"x"=>4, "y"=>1},
            {"x"=>5, "y"=>2},
            {"x"=>4, "y"=>4},
            {"x"=>2, "y"=>5},
            {"x"=>1, "y"=>4}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 3, movement_maximum: 3 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>0, "y"=>3}, {"x"=>1, "y"=>2}, {"x"=>2, "y"=>1},
            {"x"=>3, "y"=>0}, {"x"=>4, "y"=>0}, {"x"=>5, "y"=>0},
            {"x"=>6, "y"=>0}, {"x"=>6, "y"=>1}, {"x"=>6, "y"=>2},
            {"x"=>6, "y"=>3}, {"x"=>5, "y"=>4}, {"x"=>4, "y"=>5},
            {"x"=>3, "y"=>6}, {"x"=>2, "y"=>6}, {"x"=>1, "y"=>6},
            {"x"=>0, "y"=>6}, {"x"=>0, "y"=>5}, {"x"=>0, "y"=>4}
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>0},
            {"x"=>6, "y"=>0},
            {"x"=>6, "y"=>3},
            {"x"=>3, "y"=>6},
            {"x"=>0, "y"=>6},
            {"x"=>0, "y"=>3}
          ]
        end
      end
    end

    context 'square_board' do
      let(:board) { SquareBoard.new(5,5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>2}, {"x"=>4, "y"=>2},
            {"x"=>1, "y"=>2}, {"x"=>0, "y"=>2},
            {"x"=>2, "y"=>3}, {"x"=>2, "y"=>4},
            {"x"=>2, "y"=>1}, {"x"=>2, "y"=>0}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>3}, {"x"=>4, "y"=>4},
            {"x"=>3, "y"=>1}, {"x"=>4, "y"=>0},
            {"x"=>1, "y"=>3}, {"x"=>0, "y"=>4},
            {"x"=>1, "y"=>1}, {"x"=>0, "y"=>0}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>4, "y"=>2}, {"x"=>3, "y"=>3},
            {"x"=>2, "y"=>4}, {"x"=>1, "y"=>3},
            {"x"=>0, "y"=>2}, {"x"=>1, "y"=>1},
            {"x"=>2, "y"=>0}, {"x"=>3, "y"=>1},
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>0, "y"=>0}, {"x"=>2, "y"=>0},
            {"x"=>4, "y"=>0}, {"x"=>4, "y"=>2},
            {"x"=>4, "y"=>4}, {"x"=>2, "y"=>4},
            {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2},
          ]
        end
      end
    end

    context 'board agnostic' do
      let(:board) { SquareBoard.new(8, 8) }
      let(:coordinate) { {'x'=>4, 'y'=>4}  }
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: 3 } }

      context 'ally piece' do
        let(:ally_piece_coordinate) { {'x'=>4, 'y'=>2} }
        let(:ally_piece) { double :piece, coordinate: ally_piece_coordinate, user_id: user1_id }

        before do
          coordinate_map.stub(:get).with(ally_piece_coordinate, Piece).and_return(ally_piece)
        end

        it 'stops movement' do
          plies = ply_calculator.valid_plies(piece, coordinate, 'movement')
          expect(plies.length).to eql 10
          expect(plies).to_not include('x'=>4, 'y'=>2)
        end

        context 'all' do
          it 'includes the coordinate in reachable' do
            result = ply_calculator.valid_plies(piece, coordinate, 'movement', all: true)
            expect(result[PlyCalculator::REACHABLE]).to match_array [{'x'=>4, 'y'=>2}]
          end
        end
      end

      context 'enemy piece' do
        let(:enemy_piece_coordinate) { {'x'=>4, 'y'=>2} }
        let(:enemy_piece_rule) { double :piece_rule, rank: 2 }
        let(:enemy_piece) { double :piece, coordinate: enemy_piece_coordinate, user_id: user2_id, rule: enemy_piece_rule }

        before do
          coordinate_map.stub(:get).with(enemy_piece_coordinate, Piece).and_return(enemy_piece)
        end

        context 'capture_type == movement' do
          context 'piece_ranks == false' do
            let(:piece_ranks) { false }

            it 'includes the coordinate and stops further movement' do
              plies = ply_calculator.valid_plies(piece, coordinate, 'movement')
              expect(plies.length).to eql 11
              expect(plies).to_not include('x'=>4, 'y'=>1)
            end

            context 'support' do
              it 'returns just the coordinate' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'movement', support: true)
                expect(plies).to match_array [{'x'=>4, 'y'=>2}]
              end
            end
          end

          context 'piece_ranks == true' do
            let(:piece_ranks) { true }

            context 'supported rank is lower' do
              before { supported_rank.stub(:calculate).and_return(1) }

              it 'stops movement' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'movement')
                expect(plies.length).to eql 10
                expect(plies).to_not include('x'=>4, 'y'=>2)
              end

              context 'support' do
                it 'returns just the coordinate' do
                  plies = ply_calculator.valid_plies(piece, coordinate, 'movement', support: true)
                  expect(plies).to match_array [{'x'=>4, 'y'=>2}]
                end
              end
            end

            context 'supported rank is the same' do
              before { supported_rank.stub(:calculate).and_return(2) }

              it 'includes the coordinate and stops further movement' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'movement')
                expect(plies.length).to eql 11
                expect(plies).to_not include('x'=>4, 'y'=>1)
              end

              context 'support' do
                it 'returns just the coordinate' do
                  plies = ply_calculator.valid_plies(piece, coordinate, 'movement', support: true)
                  expect(plies).to match_array [{'x'=>4, 'y'=>2}]
                end
              end
            end

            context 'supported rank is higher' do
              before { supported_rank.stub(:calculate).and_return(3) }

              it 'includes the coordinate and stops further movement' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'movement')
                expect(plies.length).to eql 11
                expect(plies).to_not include('x'=>4, 'y'=>1)
              end

              context 'support' do
                it 'returns just the coordinate' do
                  plies = ply_calculator.valid_plies(piece, coordinate, 'movement', support: true)
                  expect(plies).to match_array [{'x'=>4, 'y'=>2}]
                end
              end
            end
          end
        end

        context 'capture_type == range' do
          let(:capture_type) { 'range'}

          it 'stops movement' do
            plies = ply_calculator.valid_plies(piece, coordinate, 'movement')
            expect(plies.length).to eql 10
            expect(plies).to_not include('x'=>4, 'y'=>2)
          end

          context 'all' do
            it 'does not include the coordinate in reachable' do
              result = ply_calculator.valid_plies(piece, coordinate, 'movement', all: true)
              expect(result[PlyCalculator::REACHABLE]).to match_array []
            end
          end
        end
      end

      context 'terrain' do
        let(:ally_terrain_coordinate) { {'x'=>4, 'y'=>2} }
        let(:ally_terrain) { double :terrain, coordinate: ally_terrain_coordinate, user_id: user1_id, rule: terrain_rule }
        let(:enemy_terrain_coordinate) { {'x'=>4, 'y'=>5} }
        let(:enemy_terrain) { double :terrain, coordinate: enemy_terrain_coordinate, user_id: user2_id, rule: terrain_rule }
        let(:terrain_rule) { double :terrain_rule, slows?: false, stops?: false }

        before do
          coordinate_map.stub(:get).with(ally_terrain_coordinate, Terrain).and_return(ally_terrain)
          coordinate_map.stub(:get).with(enemy_terrain_coordinate, Terrain).and_return(enemy_terrain)
        end

        context 'impassable' do
          before do
            terrain_rule.stub(:passable?).with('movement', 1).and_return(false)
            terrain_rule.stub(:stoppable?).with('movement', 1).and_return(false)
          end

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
              {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
              {'x'=>4, 'y'=>3}, # left
              # right
            ]
          end
        end

        context 'passable' do
          before { terrain_rule.stub(:passable?).with('movement', 1).and_return(true) }

          context 'can stop' do
            before { terrain_rule.stub(:stoppable?).with('movement', 1).and_return(true) }

            it 'returns the correct coordinates' do
              expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
                {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
                {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
                {'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>2}, {'x'=>4, 'y'=>1}, # left
                {'x'=>4, 'y'=>5}, {'x'=>4, 'y'=>6}, {'x'=>4, 'y'=>7} # right
              ]
            end

            context 'stops movement' do
              before { terrain_rule.stub(:stops?).with('movement', 1).and_return(true) }

              it 'returns the correct coordinates' do
                expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
                  {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
                  {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
                  {'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>2}, # left
                  {'x'=>4, 'y'=>5} # right
                ]
              end
            end

            context 'slows movement' do
              context 'by 1' do
                before do
                  terrain_rule.stub(:slows?).with('movement', 1).and_return(true)
                  terrain_rule.stub(:slows_by).with('movement').and_return(1)
                end

                it 'returns the correct coordinates' do
                  expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
                    {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
                    {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
                    {'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>2}, # left
                    {'x'=>4, 'y'=>5}, {'x'=>4, 'y'=>6} # right
                  ]
                end
              end
            end
          end

          context 'cannot stop' do
            before { terrain_rule.stub(:stoppable?).with('movement', 1).and_return(false) }

            it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
                {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
                {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
                {'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>1}, # left
                {'x'=>4, 'y'=>6}, {'x'=>4, 'y'=>7} # right
              ]
            end
          end
        end
      end
    end
  end

  context 'range' do
    let(:capture_type) { 'range' }

    context 'hexagonal_board' do
      let(:board) { HexagonalBoard.new(3) }
      let(:coordinate) { {'x'=>3, 'y'=>3}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil} }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>2, "y"=>3}, {"x"=>1, "y"=>3}, {"x"=>0, "y"=>3},
            {"x"=>3, "y"=>2}, {"x"=>3, "y"=>1}, {"x"=>3, "y"=>0},
            {"x"=>4, "y"=>2}, {"x"=>5, "y"=>1}, {"x"=>6, "y"=>0},
            {"x"=>4, "y"=>3}, {"x"=>5, "y"=>3}, {"x"=>6, "y"=>3},
            {"x"=>3, "y"=>4}, {"x"=>3, "y"=>5}, {"x"=>3, "y"=>6},
            {"x"=>2, "y"=>4}, {"x"=>1, "y"=>5}, {"x"=>0, "y"=>6}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>2, "y"=>2},
            {"x"=>4, "y"=>1},
            {"x"=>5, "y"=>2},
            {"x"=>4, "y"=>4},
            {"x"=>2, "y"=>5},
            {"x"=>1, "y"=>4}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_with_turns', range_minimum: 3, range_maximum: 3 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>0, "y"=>3}, {"x"=>1, "y"=>2}, {"x"=>2, "y"=>1},
            {"x"=>3, "y"=>0}, {"x"=>4, "y"=>0}, {"x"=>5, "y"=>0},
            {"x"=>6, "y"=>0}, {"x"=>6, "y"=>1}, {"x"=>6, "y"=>2},
            {"x"=>6, "y"=>3}, {"x"=>5, "y"=>4}, {"x"=>4, "y"=>5},
            {"x"=>3, "y"=>6}, {"x"=>2, "y"=>6}, {"x"=>1, "y"=>6},
            {"x"=>0, "y"=>6}, {"x"=>0, "y"=>5}, {"x"=>0, "y"=>4}
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>0},
            {"x"=>6, "y"=>0},
            {"x"=>6, "y"=>3},
            {"x"=>3, "y"=>6},
            {"x"=>0, "y"=>6},
            {"x"=>0, "y"=>3}
          ]
        end
      end
    end

    context "square_board" do
      let(:board) { SquareBoard.new(5,5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>2}, {"x"=>4, "y"=>2},
            {"x"=>1, "y"=>2}, {"x"=>0, "y"=>2},
            {"x"=>2, "y"=>3}, {"x"=>2, "y"=>4},
            {"x"=>2, "y"=>1}, {"x"=>2, "y"=>0}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>3}, {"x"=>4, "y"=>4},
            {"x"=>3, "y"=>1}, {"x"=>4, "y"=>0},
            {"x"=>1, "y"=>3}, {"x"=>0, "y"=>4},
            {"x"=>1, "y"=>1}, {"x"=>0, "y"=>0}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>4, "y"=>2}, {"x"=>3, "y"=>3},
            {"x"=>2, "y"=>4}, {"x"=>1, "y"=>3},
            {"x"=>0, "y"=>2}, {"x"=>1, "y"=>1},
            {"x"=>2, "y"=>0}, {"x"=>3, "y"=>1},
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>0, "y"=>0}, {"x"=>2, "y"=>0},
            {"x"=>4, "y"=>0}, {"x"=>4, "y"=>2},
            {"x"=>4, "y"=>4}, {"x"=>2, "y"=>4},
            {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2},
          ]
        end
      end
    end

    context 'board agnostic' do
      let(:board) { SquareBoard.new(8, 8) }
      let(:coordinate) { {'x'=>4, 'y'=>4}  }
      let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: 3 } }

      context 'ally piece' do
        let(:ally_piece_coordinate) { {'x'=>4, 'y'=>2} }
        let(:ally_piece) { double :piece, coordinate: ally_piece_coordinate, user_id: user1_id }

        before do
          coordinate_map.stub(:get).with(ally_piece_coordinate, Piece).and_return(ally_piece)
        end

        it 'stops range' do
          plies = ply_calculator.valid_plies(piece, coordinate, 'range')
          expect(plies.length).to eql 10
          expect(plies).to_not include('x'=>4, 'y'=>2)
        end
      end

      context 'enemy piece' do
        let(:enemy_piece_coordinate) { {'x'=>4, 'y'=>2} }
        let(:enemy_piece_rule) { double :piece_rule, rank: 2 }
        let(:enemy_piece) { double :piece, coordinate: enemy_piece_coordinate, user_id: user2_id, rule: enemy_piece_rule }

        before do
          coordinate_map.stub(:get).with(enemy_piece_coordinate, Piece).and_return(enemy_piece)
        end

        context 'piece_ranks == false' do
          let(:piece_ranks) { false }

          it 'includes the coordinate and stops further range' do
            plies = ply_calculator.valid_plies(piece, coordinate, 'range')
            expect(plies.length).to eql 11
            expect(plies).to_not include('x'=>4, 'y'=>1)
          end

          context 'capture_only' do
            it 'returns just the coordinate' do
              plies = ply_calculator.valid_plies(piece, coordinate, 'range', capture_only: true)
              expect(plies).to match_array [{'x'=>4, 'y'=>2}]
            end
          end

          context 'support' do
            it 'returns just the coordinate' do
              plies = ply_calculator.valid_plies(piece, coordinate, 'range', support: true)
              expect(plies).to match_array [{'x'=>4, 'y'=>2}]
            end
          end
        end

        context 'piece_ranks == true' do
          let(:piece_ranks) { true }

          context 'supported rank is lower' do
            before { supported_rank.stub(:calculate).and_return(1) }

            it 'stops range' do
              plies = ply_calculator.valid_plies(piece, coordinate, 'range')
              expect(plies.length).to eql 10
              expect(plies).to_not include('x'=>4, 'y'=>2)
            end

            context 'capture_only' do
              it 'returns empty array' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'range', capture_only: true)
                expect(plies).to match_array []
              end
            end

            context 'support' do
              it 'returns just the coordinate' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'range', support: true)
                expect(plies).to match_array [{'x'=>4, 'y'=>2}]
              end
            end
          end

          context 'supported rank is the same' do
            before { supported_rank.stub(:calculate).and_return(2) }

            it 'includes the coordinate and stops further range' do
              plies = ply_calculator.valid_plies(piece, coordinate, 'range')
              expect(plies.length).to eql 11
              expect(plies).to_not include('x'=>4, 'y'=>1)
            end

            context 'capture_only' do
              it 'returns just the coordinate' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'range', capture_only: true)
                expect(plies).to match_array [{'x'=>4, 'y'=>2}]
              end
            end

            context 'support' do
              it 'returns just the coordinate' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'range', support: true)
                expect(plies).to match_array [{'x'=>4, 'y'=>2}]
              end
            end
          end

          context 'supported rank is higher' do
            before { supported_rank.stub(:calculate).and_return(3) }

            it 'includes the coordinate and stops further range' do
              plies = ply_calculator.valid_plies(piece, coordinate, 'range')
              expect(plies.length).to eql 11
              expect(plies).to_not include('x'=>4, 'y'=>1)
            end

            context 'capture_only' do
              it 'returns just the coordinate' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'range', capture_only: true)
                expect(plies).to match_array [{'x'=>4, 'y'=>2}]
              end
            end

            context 'support' do
              it 'returns just the coordinate' do
                plies = ply_calculator.valid_plies(piece, coordinate, 'range', support: true)
                expect(plies).to match_array [{'x'=>4, 'y'=>2}]
              end
            end
          end
        end
      end

      context 'terrain' do
        let(:ally_terrain_coordinate) { {'x'=>4, 'y'=>2} }
        let(:ally_terrain) { double :terrain, coordinate: ally_terrain_coordinate, user_id: user1_id, rule: terrain_rule }
        let(:enemy_terrain_coordinate) { {'x'=>4, 'y'=>5} }
        let(:enemy_terrain) { double :terrain, coordinate: enemy_terrain_coordinate, user_id: user2_id, rule: terrain_rule }
        let(:terrain_rule) { double :terrain_rule, slows?: false, stoppable?: true, stops?: false }

        before do
          coordinate_map.stub(:get).with(ally_terrain_coordinate, Terrain).and_return(ally_terrain)
          coordinate_map.stub(:get).with(enemy_terrain_coordinate, Terrain).and_return(enemy_terrain)
        end

        context 'impassable' do
          before { terrain_rule.stub(:passable?).with('range', 1).and_return(false) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
              {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
              {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
              {'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>2}, # left
              {'x'=>4, 'y'=>5} # right
            ]
          end
        end

        context 'passable' do
          before { terrain_rule.stub(:passable?).with('range', 1).and_return(true) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
              {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
              {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
              {'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>2}, {'x'=>4, 'y'=>1}, # left
              {'x'=>4, 'y'=>5}, {'x'=>4, 'y'=>6}, {'x'=>4, 'y'=>7} # right
            ]
          end
        end
      end
    end
  end
end
