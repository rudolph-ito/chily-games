class PlayController < ApplicationController
  before_filter :authenticate_user!
  layout 'play'

  def play
  end
end
