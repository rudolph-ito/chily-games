require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/boards/square_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator/ply_evaluator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator/line_ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator/turn_ply_calculator.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'
require ROOT_DIRECTORY + '/app/game_storage/terrain.rb'
require ROOT_DIRECTORY + '/lib/coordinate_distance.rb'

describe PlyCalculator do
  let(:ply_calculator) { PlyCalculator.new(board, coordinate_map) }
  let(:coordinate_map) { double :coordinate_map, get: nil }
  let(:piece) { double :piece, coordinate: coordinate, user_id: user1_id, type_id: 1, rule: piece_rule }
  let(:user1_id) { 1 }
  let(:user2_id) { 2 }
  let(:piece_rule) { double :piece_rule, piece_rule_parameters.merge(capture_type: capture_type) }
  let(:capture_type) { 'movement' }

  before { coordinate_map.stub(:get).with(coordinate, Piece).and_return(piece) }

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

      context 'other pieces' do
        let(:ally_piece_coordinate) { {'x'=>4, 'y'=>2} }
        let(:ally_piece) { double :piece, coordinate: ally_piece_coordinate, user_id: user1_id }
        let(:enemy_piece_coordinate) { {'x'=>4, 'y'=>5} }
        let(:enemy_piece) { double :piece, coordinate: enemy_piece_coordinate, user_id: user2_id }

        before do
          coordinate_map.stub(:get).with(ally_piece_coordinate, Piece).and_return(ally_piece)
          coordinate_map.stub(:get).with(enemy_piece_coordinate, Piece).and_return(enemy_piece)
        end

        context 'capture_type == movement' do
          let(:capture_type) { 'movement' }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
              {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
              {'x'=>4, 'y'=>3}, # left
              {'x'=>4, 'y'=>5} # right
            ]
          end
        end

        context 'capture_type == range' do
          let(:capture_type) { 'range' }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
              {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
              {'x'=>4, 'y'=>3}, # left
              # right
            ]
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
          expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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

      context 'other pieces' do
        let(:ally_piece_coordinate) { {'x'=>4, 'y'=>2} }
        let(:ally_piece) { double :piece, coordinate: ally_piece_coordinate, user_id: user1_id }
        let(:enemy_piece_coordinate) { {'x'=>4, 'y'=>5} }
        let(:enemy_piece) { double :piece, coordinate: enemy_piece_coordinate, user_id: user2_id }

        before do
          coordinate_map.stub(:get).with(ally_piece_coordinate, Piece).and_return(ally_piece)
          coordinate_map.stub(:get).with(enemy_piece_coordinate, Piece).and_return(enemy_piece)
        end

        it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
              {'x'=>3, 'y'=>4}, {'x'=>2, 'y'=>4}, {'x'=>1, 'y'=>4}, # down
              {'x'=>5, 'y'=>4}, {'x'=>6, 'y'=>4}, {'x'=>7, 'y'=>4}, # up
              {'x'=>4, 'y'=>3}, # left
              {'x'=>4, 'y'=>5} # right
            ]
          end

        context 'in a game' do
          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [{'x'=>4, 'y'=>5}]
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
            expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
            expect( ply_calculator.valid_plies(piece, coordinate, 'range', ignore_capture_restriction: true) ).to match_array [
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
