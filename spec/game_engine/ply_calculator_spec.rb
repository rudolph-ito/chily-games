require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/boards/square_board.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_data.rb'
require ROOT_DIRECTORY + '/lib/coordinate_distance.rb'
require ROOT_DIRECTORY + '/app/game_engine/ply_calculator.rb'

describe PlyCalculator do
  let(:ply_calculator) { PlyCalculator.new(board, piece_repository, terrain_repository) }
  let(:piece_repository) { double :piece_repository, find_by_coordinate: nil }
  let(:terrain_repository) { double :terrain_repository, find_by_coordinate: nil }
  let(:piece) { double :piece, user: user1, piece_type_id: 1, rule: piece_rule }
  let(:user1) { double :user }
  let(:user2) { double :user }
  let(:piece_rule) { double :piece_rule, piece_rule_parameters.merge(capture_type: capture_type) }
  let(:capture_type) { 'movement' }

  context 'movement' do
    context 'hexagonal_board' do
      let(:board) { HexagonalBoard.new(4) }
      let(:coordinate) { {'x'=>0, 'y'=>0, 'z'=>0}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil} }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>1, "y"=>0, "z"=>0}, {"x"=>2, "y"=>0, "z"=>0}, {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-1, "y"=>0, "z"=>0}, {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>1, "z"=>0}, {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>0}, {"x"=>0, "y"=>-2, "z"=>0}, {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>0, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>-2}, {"x"=>0, "y"=>0, "z"=>-3}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>1, "y"=>1, "z"=>0},
            {"x"=>-1, "y"=>-1, "z"=>0},
            {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>1, "z"=>1},
            {"x"=>0, "y"=>-1, "z"=>-1}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>2, "y"=>0, "z"=>0}, {"x"=>1, "y"=>1, "z"=>0}, {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-1, "y"=>-1, "z"=>0}, {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>1, "z"=>1}, {"x"=>0, "y"=>-2, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>-2}
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
            {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>-3}
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
      let(:board) { SquareBoard.new(5, 5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil } }

      context 'other pieces' do
        let(:piece_at_2_0) { double :piece, user: user1 }
        let(:piece_at_1_2) { double :piece, user: user2 }

        before do
          piece_repository.stub(:find_by_coordinate).with({'x'=>2, 'y'=>0}).and_return(piece_at_2_0)
          piece_repository.stub(:find_by_coordinate).with({'x'=>1, 'y'=>2}).and_return(piece_at_1_2)
        end

        context 'capture_type == movement' do
          let(:capture_type) { 'movement' }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end

        context 'capture_type == range' do
          let(:capture_type) { 'range' }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end
      end

      context 'terrain' do
        let(:terrain_at_2_0) { double :piece, user: user1, rule: terrain_rule }
        let(:terrain_at_1_2) { double :piece, user: user2, rule: terrain_rule }
        let(:terrain_rule) { double :terrain_rule }

        before do
          terrain_repository.stub(:find_by_coordinate).with({'x'=>2, 'y'=>0}).and_return(terrain_at_2_0)
          terrain_repository.stub(:find_by_coordinate).with({'x'=>1, 'y'=>2}).and_return(terrain_at_1_2)
        end

        context 'blocking' do
          before { terrain_rule.stub(:block?).with('movement', 1).and_return(true) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end

        context 'not blocking' do
          before { terrain_rule.stub(:block?).with('movement', 1).and_return(false) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'movement') ).to match_array [
              {'x'=>0, 'y'=>2}, {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>0}, {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end
      end
    end
  end

  context 'range' do
    let(:capture_type) { 'range' }

    context 'hexagonal_board' do
      let(:board) { HexagonalBoard.new(4) }
      let(:coordinate) { {'x'=>0, 'y'=>0, 'z'=>0}  }

      context 'orthogonal_line' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil} }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>1, "y"=>0, "z"=>0}, {"x"=>2, "y"=>0, "z"=>0}, {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-1, "y"=>0, "z"=>0}, {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>1, "z"=>0}, {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>0}, {"x"=>0, "y"=>-2, "z"=>0}, {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>0, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>-2}, {"x"=>0, "y"=>0, "z"=>-3}
          ]
        end
      end

      context 'diagonal_line' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_line', range_minimum: 1, range_maximum: nil } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>1, "y"=>1, "z"=>0},
            {"x"=>-1, "y"=>-1, "z"=>0},
            {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>1, "z"=>1},
            {"x"=>0, "y"=>-1, "z"=>-1}
          ]
        end
      end

      context 'orthogonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'orthogonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>2, "y"=>0, "z"=>0}, {"x"=>1, "y"=>1, "z"=>0}, {"x"=>1, "y"=>0, "z"=>-1},
            {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-1, "y"=>-1, "z"=>0}, {"x"=>-1, "y"=>0, "z"=>1},
            {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>1, "z"=>1}, {"x"=>0, "y"=>-2, "z"=>0},
            {"x"=>0, "y"=>-1, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>-2}
          ]
        end
      end

      context 'diagonal_with_turns' do
        let(:piece_rule_parameters) { { range_type: 'diagonal_with_turns', range_minimum: 2, range_maximum: 2 } }

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {"x"=>3, "y"=>0, "z"=>0},
            {"x"=>-3, "y"=>0, "z"=>0},
            {"x"=>0, "y"=>3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>3},
            {"x"=>0, "y"=>-3, "z"=>0},
            {"x"=>0, "y"=>0, "z"=>-3}
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
      let(:board) { SquareBoard.new(5, 5) }
      let(:coordinate) { {'x'=>2, 'y'=>2}  }
      let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil } }

      context 'other pieces' do
        let(:piece_at_2_0) { double :piece, user: user1 }
        let(:piece_at_1_2) { double :piece, user: user2 }

        before do
          piece_repository.stub(:find_by_coordinate).with({'x'=>2, 'y'=>0}).and_return(piece_at_2_0)
          piece_repository.stub(:find_by_coordinate).with({'x'=>1, 'y'=>2}).and_return(piece_at_1_2)
          piece_repository.stub(:find_by_coordinate).with({'x'=>3, 'y'=>2}).and_return(piece)
        end

        it 'returns the correct coordinates' do
          expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
            {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
            {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
          ]
        end
      end

      context 'terrain' do
        let(:terrain_at_2_0) { double :piece, user: user1, rule: terrain_rule }
        let(:terrain_at_1_2) { double :piece, user: user2, rule: terrain_rule }
        let(:terrain_rule) { double :terrain_rule }

        before do
          terrain_repository.stub(:find_by_coordinate).with({'x'=>2, 'y'=>0}).and_return(terrain_at_2_0)
          terrain_repository.stub(:find_by_coordinate).with({'x'=>1, 'y'=>2}).and_return(terrain_at_1_2)
        end

        context 'blocking' do
          before { terrain_rule.stub(:block?).with('range', 1).and_return(true) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
              {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end

        context 'not blocking' do
          before { terrain_rule.stub(:block?).with('range', 1).and_return(false) }

          it 'returns the correct coordinates' do
            expect( ply_calculator.valid_plies(piece, coordinate, 'range') ).to match_array [
              {'x'=>0, 'y'=>2}, {'x'=>1, 'y'=>2}, {'x'=>3, 'y'=>2}, {'x'=>4, 'y'=>2},
              {'x'=>2, 'y'=>0}, {'x'=>2, 'y'=>1}, {'x'=>2, 'y'=>3}, {'x'=>2, 'y'=>4}
            ]
          end
        end
      end
    end
  end
end
