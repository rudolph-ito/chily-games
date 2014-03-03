require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/remove_from_initial_setup.rb'

describe RemoveFromInitialSetup do
  let(:remove_from_initial_setup) { RemoveFromInitialSetup.new(game, user, coordinate, type) }
  let(:game) { double :game, initial_setup: initial_setup, board: board }
  let(:initial_setup) { double :initial_setup, remove: nil }
  let(:board) { double :board }
  let(:user) { double :user }
  let(:coordinate) { double :coordinate }
  let(:type) { double :type }
  let(:user_setup) { double :user_setup }
  let(:object) { double :object }

  before { game.stub(:setup_for_user).with(user).and_return(user_setup) }

  describe '#call' do
    context 'object found' do
      before { user_setup.stub(:get).with(coordinate, type).and_return(object) }

      it 'removes it from the initial_setup' do
        remove_from_initial_setup.call
        expect(initial_setup).to have_received(:remove).with(object)
      end
    end

    context 'object not found' do
      before { user_setup.stub(:get).with(coordinate, type).and_return(nil) }

      it 'does not remove it from the initial_setup' do
        remove_from_initial_setup.call
        expect(initial_setup).not_to have_received(:remove)
      end
    end
  end
end
