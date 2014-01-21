class Api::ChallengesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :build_challenge, only: [:create]
  before_filter :get_challenge, only: [:destroy, :accept, :decline]
  before_filter :authorize, except: [:index]

  def index
    @challenges = if params[:your]
      Challenge.where('challenger_id = ? OR challenged_id = ?', current_user.id, current_user.id)
    else
      Challenge.where.not(challenger_id: current_user.id).where(challenged_id: nil)
    end
  end

  def create
    @challenge.challenger = current_user

    if @challenge.save
      render :show
    else
      render json: @challenge.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @challenge.destroy
  end

  def accept
    @game = @challenge.accept!(current_user)
  end

  def decline
    @challenge.decline!(current_user)
  end

  protected

  def build_challenge
    @challenge = Challenge.new(challenge_params)
  end

  def get_challenge
    @challenge = Challenge.find(params[:id])
  end

  def authorize
    authorize_action_for @challenge
  end

  def challenge_params
    params.require(:challenge).permit(:variant_id, :play_as)
  end

end
