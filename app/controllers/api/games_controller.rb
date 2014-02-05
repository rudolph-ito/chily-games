class Api::GamesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :get_game, except: [:current]
  before_filter :authorize, except: [:current]
  before_filter :ensure_valid_type, only: [:setup_add, :setup_move, :setup_remove]

  def current
    @game_id = Game.current.for_user(current_user).pluck(:id).first
  end

  def show
  end

  ########################################
  # Setup
  ########################################

  def abort
    @game.destroy
    head :ok
  end

  def setup_add
    @game.setup_add(current_user, params[:type], params[:type_id], params[:coordinate])
    head :ok
  end

  def setup_move
    @game.setup_move(current_user, params[:type], params[:from], params[:to])
    head :ok
  end

  def setup_remove
    @game.setup_remove(current_user, params[:type], params[:coordinate])
    head :ok
  end

  def setup_complete
    errors = @game.setup_errors(current_user)
    if errors.empty?
      @game.setup_complete(current_user)
      render json: { success: true, action: @game.action, action_to_id: @game.action_to_id }
    else
      render json: { success: false, errors: errors }
    end
  end

  ########################################
  # Play
  ########################################

  def opponent_setup
  end

  def valid_piece_moves
    piece = @game.pieces.for_coordinate(params[:coordinate]).first
    moves = piece ? @game.valid_plies(piece, piece.coordinate, 'movement') : []
    render json: moves
  end

  def piece_move
    scrub_coordinate(params[:from], params[:to])
    result = @game.ply_valid?(params[:from], params[:to])

    if result == Game::PLY_VALID
      @game.move_piece(params[:from], params[:to])
      render json: { success: true, from: params[:from], to: params[:to], action: @game.action, action_to_id: @game.action_to_id }
    else
      render json: { success: false }
    end
  end

  def resign
    @game.resign(current_user)
    render json: { action: @game.action, action_to_id: @game.action_to_id }
  end

  protected

  def get_game
    @game = Game.find(params[:id])
  end

  def authorize
    authorize_action_for @game
  end

  def ensure_valid_type
    head :unprocessable_entity unless ['piece', 'terrain'].include?(params[:type])
  end

  def scrub_coordinate(*coords)
    coords.each do |coord|
      coord.each_pair{ |k, v| coord[k] = v.to_i }
    end
  end

end
