class Api::GamesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :get_game, except: [:current]
  before_filter :authorize, except: [:current]
  before_filter :scrub_coordinates, only: [:setup_add, :setup_move, :setup_remove, :valid_piece_moves, :piece_move, :piece_move_with_range_capture]
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
    piece = @game.pieces.for_coordinate(params[:from]).first
    if piece && @game.ply_valid?(piece, params[:to])
      if piece.rule.range_capture?
        render json: { success: false, from: params[:from], to: params[:to], range_captures: @game.valid_plies(piece, params[:to], 'range') }
      else
        @game.move_piece(piece, params[:to])
        render json: { success: true, from: params[:from], to: params[:to], action: @game.action, action_to_id: @game.action_to_id }
      end
    else
      render json: { success: false }
    end
  end

  def piece_move_with_range_capture
    piece = @game.pieces.for_coordinate(params[:from]).first
    if piece && @game.ply_valid?(piece, params[:to], params[:range_capture])
      @game.move_piece(piece, params[:to], params[:range_capture])
      render json: { success: true, from: params[:from], to: params[:to], range_capture: params[:range_capture], action: @game.action, action_to_id: @game.action_to_id }
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

  def scrub_coordinates
    coordinate_keys = [:coordinate, :to, :from, :range_capture]

    coordinate_keys.each do |coordinate_key|
      coordinate = params[coordinate_key]
      coordinate.each_pair{ |k, v| coordinate[k] = v.to_i } if coordinate
    end
  end

end
