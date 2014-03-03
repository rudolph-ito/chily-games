require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/move_in_initial_setup.rb'

describe MoveInInitialSetup do
  let(:move_in_initial_setup) { MoveInInitialSetup.new(game, user, from, to, type) }
  let(:game) { double :game, initial_setup: initial_setup, board: board }
  let(:initial_setup) { double :initial_setup, move: nil }
  let(:board) { double :board }
  let(:user) { double :user }
  let(:from) { double :coordinate }
  let(:to) { double :coordinate }
  let(:type) { double :type }
  let(:user_setup) { double :user_setup }
  let(:object) { double :object, coordinate: from, color: 'alabaster' }

  before do
    game.stub(:setup_for_user).with(user).and_return(user_setup)
  end

  describe '#call' do
    context 'object not found' do
      before { user_setup.stub(:get).with(from, type).and_return(nil) }

      it 'does not move it in the initial_setup' do
        move_in_initial_setup.call
        expect(initial_setup).not_to have_received(:move)
      end
    end

    context 'object found' do
      before { user_setup.stub(:get).with(from, type).and_return(object) }

      context 'to is invalid' do
        before { board.stub(:coordinate_valid?).with(to).and_return(false) }

        it 'does not move it in the initial_setup' do
          move_in_initial_setup.call
          expect(initial_setup).not_to have_received(:move)
        end
      end

      context 'to is valid' do
        before { board.stub(:coordinate_valid?).with(to).and_return(true) }

        context 'to in enemy territory' do
          before { board.stub(:territory).with(to).and_return('onyx') }

          it 'does not move it in the initial_setup' do
            move_in_initial_setup.call
            expect(initial_setup).not_to have_received(:move)
          end
        end

        context 'to in neutral territory' do
          before { board.stub(:territory).with(to).and_return('neutral') }

          it 'does not move it in the initial_setup' do
            move_in_initial_setup.call
            expect(initial_setup).not_to have_received(:move)
          end
        end

        context 'to in home territory' do
          before { board.stub(:territory).with(to).and_return('alabaster') }

          it 'moves it in the initial_setup' do
            move_in_initial_setup.call
            expect(initial_setup).to have_received(:move).with(object, to)
          end
        end
      end
    end
  end
end
