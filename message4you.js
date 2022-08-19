(function ($) {
    $.fn.message4you = function (option) {
        let $this = this;
        let options = {
            line_feed_regex: '\\.|。',
            canvas_width: $this.width() || $(window).width(),
            canvas_height: $this.height() || $(window).height(),
            min_delay_character: 20,
            max_delay_character: 100,
            transition_time: 1000,
            message_limit_time: 3000,
            wait_at_show: 2000,
            wait_at_clear: 2000,
            add_character_handler: ($char, status) => {
                const x = Math.random() * options.canvas_width * 2 - (options.canvas_width);
                const y = Math.random() * options.canvas_height * 2 - (options.canvas_height);
                const z = Math.random() * 15
                const d = Math.random() * 1440 - 720;
                const w = Math.min(options.min_delay_character, Math.max(options.max_delay_character, options.message_limit_time / status.message_character_length));
                $char.css({
                    transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + d + 'deg) scale(' + z + ')',
                    transition: options.transition_time + 'ms all',
                    transitionDelay: ((!status.clear) ? w * status.message_character_index : 0) + 'ms',
                    opacity: 0,
                });
                if (!status.clear) {
                    status.timeout += w;
                    $char.css({
                        lineHeight: 1.0,
                        display: 'inline-block',
                        color: 'rgb(' + ((Math.random() * 128) + 64) + ',' + ((Math.random() * 128) + 64) + ',' + ((Math.random() * 128) + 64) + ')',
                        fontSize: 'min(' + (100 / (status.line_character_length + 8)) + 'vw,' + (100 / (status.message_length + 2)) + 'vh)',
                        fontWeight: 'bold',
                        opacity: 0,
                    });
                }
                return $char;
            },
            show_character_handler: ($char, status) => {
                $char.css({
                    transform: '',
                    opacity: 1,
                });
            },
            clear_character_handler: ($char, status) => {
                status.clear = true;
                options.add_character_handler($char, status);
            },
        };
        $.extend(options, option);

        function getQuery(name) {
            let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
            let match = regex.exec(window.location.href);
            if ((match) && (match[2])) {
                return match[2];
            }
            return null;
        }

        function getMessages() {
            let data = getQuery('m');
            if (data) {
                data = decodeURIComponent(atob(decodeURIComponent(data)));
                if (options.line_feed_regex) {
                    let regex = new RegExp('(' + options.line_feed_regex + ')([^\n])', 'g');
                    data = data.replace(regex, '$1\n$2');
                }
                return data.split('\n\n');
            }
            return null;
        }

        function renderForm() {
            $this.append(
                $('<form>').attr({
                    method: 'GET',
                    target: 'preview',
                }).append(
                    $('<input>').attr({
                        type: 'hidden',
                        name: 'm',
                    })
                ),
                $('<textarea>').attr({
                    name: 'm',
                }).css({
                    display: 'block',
                    height: '300px',
                    minWidth: 'min(500px, 95vw)',
                    padding: '5px',
                }),
                $('<button>').text('preview').on('click', () => {
                    let val = $this.find('textarea').val();
                    if (val) {
                        $this.find('input').val(btoa(encodeURIComponent(val)));
                        $this.find('form').submit();
                    }
                }).css({
                    marginTop: '10px',
                    padding: '5px 20px',
                })
            );
        }

        function addMessage(message) {
            return promise = new Promise(resolve => {
                message = message.split('\n');
                let status = {
                    message_length: message.length,
                    message_character_length: 0,
                    message_character_index: 0,
                    timeout: options.wait_at_show,
                }
                $.each(message, (i, line) => {
                    status.message_character_length += line.length;
                });
                $.each(message, (i, line) => {
                    let $message = $('<div>').addClass('m4u-message');
                    status.line_character_length = line.length;
                    for (let j = 0; j < line.length; j++) {
                        status.line_character_index = j;
                        let char = line.charAt(j);
                        if (char === ' ') {
                            char = '&nbsp;';
                        }
                        let $char = $('<span>').addClass('m4u-char').html(char);
                        $message.append(options.add_character_handler($char, status));
                        status.message_character_index++;
                    }
                    $this.append($message);
                });
                setTimeout(() => resolve(status.timeout), 10);
            });
        }

        function showMessage(timeout) {
            return promise = new Promise(resolve => {
                let status = {
                    timeout: timeout,
                };
                $this.find('.m4u-char').each((i, char) => {
                    status.index = i;
                    options.show_character_handler($(char), status);
                });
                setTimeout(() => resolve(), status.timeout);
            });
        }

        function clearMessage() {
            return promise = new Promise(resolve => {
                let status = {
                    timeout: options.wait_at_clear,
                };
                $this.find('.m4u-char').each((i, char) => {
                    status.index = i;
                    options.clear_character_handler($(char), status);
                });
                setTimeout(() => resolve(), status.timeout);
            });
        }

        async function showMessages() {
            $this.css({
                display: 'flex',
                overflow: 'hidden',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center',
            });
            for (let i = 0; i < messages.length; i++) {
                $this.empty();
                await showMessage(await addMessage(messages[i]));
                if (i + 1 !== messages.length) {
                    await clearMessage();
                }
            }
        }

        let messages = getMessages();
        if (!messages) {
            renderForm();
            return;
        }

        showMessages();
    };
    $(document).ready(() => {
        $('#message4you').length && $('#message4you').message4you();
    });
})(jQuery);
